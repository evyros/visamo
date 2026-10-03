import "server-only";

// The model behind the assistant, through OpenRouter's OpenAI-compatible API.
// No web search: OpenRouter only searches when a request asks for its web
// plugin (or a ":online" model), and these never do.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** GPT-5.6 Luna. OPENROUTER_MODEL overrides it, e.g. to try another model. */
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-5.6-luna";

/**
 * The document checker's models, by what a document's check asks for
 * (lib/documents/checks.ts). "standard" for most: Gemini Flash. "strong" for
 * the hardest to read, such as a scanned form with handwritten ticks and
 * signatures: Claude Sonnet, which reads scanned Hebrew well but costs about
 * 3x as much. Haiku misreads them (names, dates). OPENROUTER_CHECK_MODEL and
 * OPENROUTER_STRONG_CHECK_MODEL override them.
 */
export const CHECK_MODELS = {
  standard: process.env.OPENROUTER_CHECK_MODEL || "google/gemini-3.8-flash",
  strong: process.env.OPENROUTER_STRONG_CHECK_MODEL || "anthropic/claude-sonnet-5.5",
} as const;

export type CheckModel = keyof typeof CHECK_MODELS;

type TextPart = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };
/** An image, as a data: URL. */
type ImagePart = { type: "image_url"; image_url: { url: string } };
/** A PDF, as a data: URL. */
type FilePart = { type: "file"; file: { filename: string; file_data: string } };

export type ContentPart = TextPart | ImagePart | FilePart;

export type ModelMessage =
  | { role: "system"; content: string | TextPart[] }
  | { role: "user"; content: string | ContentPart[] }
  | { role: "assistant"; content: string };

function request(body: Record<string, unknown>) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set. See .env.example.");
  return fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Shown on OpenRouter's dashboard for the app's requests.
      "X-Title": "Visamo",
    },
    body: JSON.stringify({ model: MODEL, ...body }),
  });
}

/**
 * The answer's text as it's written, then, as the generator's return value,
 * the call's usage (OpenRouter sends it in the last event). Throws if the
 * request fails before any text.
 */
export async function* streamCompletion(
  messages: ModelMessage[],
  maxTokens: number,
): AsyncGenerator<string, Completion & { firstTokenMs: number | null }> {
  const started = performance.now();
  const response = await request({ messages, max_tokens: maxTokens, stream: true, usage: { include: true } });
  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter answered ${response.status}: ${await response.text()}`);
  }

  let answer = "";
  let firstTokenMs: number | null = null;
  // Filled in from the events as they come; every event repeats id, provider and model.
  let last: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  let finishReason: string | null = null;
  let usage: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const result = () => ({
    ...fromResponse({ ...last, usage, choices: [{ finish_reason: finishReason }] }, answer, started),
    firstTokenMs,
  });

  // Server-sent events: `data: {json}` lines, `: comment` keep-alives, and `data: [DONE]`.
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    buffer += chunk.value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return result();
      const event = JSON.parse(data);
      if (event.error) throw new Error(`OpenRouter stream error: ${JSON.stringify(event.error)}`);
      last = event;
      if (event.usage) usage = event.usage;
      finishReason = event.choices?.[0]?.finish_reason ?? finishReason;
      const text = event.choices?.[0]?.delta?.content;
      if (text) {
        firstTokenMs ??= Math.round(performance.now() - started);
        answer += text;
        yield text as string;
      }
    }
  }
  return result();
}

/** A whole short answer at once, with its usage. */
export async function complete(messages: ModelMessage[], maxTokens: number): Promise<Completion> {
  const started = performance.now();
  const response = await request({ messages, max_tokens: maxTokens, usage: { include: true } });
  if (!response.ok) throw new Error(`OpenRouter answered ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return fromResponse(json, ((json.choices?.[0]?.message?.content as string | undefined) ?? "").trim(), started);
}

/** One model call, with what it cost, as OpenRouter reports it. */
export type Completion = {
  /** The answer's text. */
  answer: string;
  /** OpenRouter's generation id: look it up on its dashboard, or at /api/v1/generation. */
  generationId: string | null;
  /** The provider that served it, and the model it ran. */
  provider: string | null;
  model: string | null;
  /** "stop" when the answer ended on its own; "length" when max_tokens cut it off. */
  finishReason: string | null;
  tokensIn: number;
  tokensOut: number;
  /** Of `tokensOut`, the model's hidden reasoning: it counts toward max_tokens, before the answer. */
  reasoningTokens: number;
  /** The reasoning as the model reports it (Gemini: a summary of it); null when it reports none, or streamed. */
  reasoning: string | null;
  /** Input tokens read from the prompt cache (cheaper). */
  cachedTokens: number;
  /** In US dollars; null if OpenRouter didn't report it. */
  costUsd: number | null;
  /** Wall-clock time of the request. */
  ms: number;
};

/**
 * An answer in the given JSON schema, as text for the caller to parse, for
 * requests with a couple's documents in them. Only providers that don't keep
 * or train on the data are used (zero data retention), and only ones that
 * support the schema; the request fails rather than fall back to others.
 */
export async function completeJson(
  messages: ModelMessage[],
  { model, maxTokens, name, schema }: { model: string; maxTokens: number; name: string; schema: object },
): Promise<Completion> {
  const started = performance.now();
  const response = await request({
    model,
    messages,
    max_tokens: maxTokens,
    response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
    provider: { zdr: true, data_collection: "deny", require_parameters: true },
    // Adds the call's cost to `usage`.
    usage: { include: true },
  });
  if (!response.ok) throw new Error(`OpenRouter answered ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return fromResponse(json, (json.choices?.[0]?.message?.content as string | undefined) ?? "", started);
}

/** A call's Completion, from OpenRouter's response (or a stream's events, gathered into one). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromResponse(json: Record<string, any>, answer: string, started: number): Completion {
  const usage = json.usage ?? {};
  return {
    answer,
    generationId: json.id ?? null,
    provider: json.provider ?? null,
    model: json.model ?? null,
    finishReason: json.choices?.[0]?.finish_reason ?? null,
    tokensIn: usage.prompt_tokens ?? 0,
    tokensOut: usage.completion_tokens ?? 0,
    reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? 0,
    reasoning: json.choices?.[0]?.message?.reasoning || null,
    cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
    costUsd: typeof usage.cost === "number" ? usage.cost : null,
    ms: Math.round(performance.now() - started),
  };
}

/** One of a chat answer's model calls: the answer itself, or a new chat's title. */
export type ChatCall = Completion & { purpose: "answer" | "title"; firstTokenMs?: number | null };

/** A run's calls summed: what a check or an answer took. */
export function callTotals(calls: Completion[]) {
  const sum = (pick: (call: Completion) => number) => calls.reduce((total, call) => total + pick(call), 0);
  const costs = calls.map((call) => call.costUsd);
  return {
    tokensIn: sum((c) => c.tokensIn),
    tokensOut: sum((c) => c.tokensOut),
    cachedTokens: sum((c) => c.cachedTokens),
    // Unknown if any call's cost is: a partial sum would read as the whole.
    costUsd: costs.every((cost) => cost !== null) ? costs.reduce((a, b) => a + b, 0) : null,
    modelMs: sum((c) => c.ms),
  };
}
