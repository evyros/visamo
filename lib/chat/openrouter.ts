import "server-only";

// The model behind the assistant, through OpenRouter's OpenAI-compatible API.
// No web search: OpenRouter only searches when a request asks for its web
// plugin (or a ":online" model), and these never do.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Claude Haiku, latest. OPENROUTER_MODEL overrides it, e.g. to try another model. */
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

/** The document checker's model: Claude Haiku, latest, like the chat. OPENROUTER_CHECK_MODEL overrides it. */
export const CHECK_MODEL = process.env.OPENROUTER_CHECK_MODEL || "anthropic/claude-haiku-4.5";

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

/** The answer's text as it's written. Throws if the request fails before any text. */
export async function* streamCompletion(messages: ModelMessage[], maxTokens: number) {
  const response = await request({ messages, max_tokens: maxTokens, stream: true });
  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter answered ${response.status}: ${await response.text()}`);
  }

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
      if (data === "[DONE]") return;
      const event = JSON.parse(data);
      if (event.error) throw new Error(`OpenRouter stream error: ${JSON.stringify(event.error)}`);
      const text = event.choices?.[0]?.delta?.content;
      if (text) yield text as string;
    }
  }
}

/** A whole short answer at once. */
export async function complete(messages: ModelMessage[], maxTokens: number) {
  const response = await request({ messages, max_tokens: maxTokens });
  if (!response.ok) throw new Error(`OpenRouter answered ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return (json.choices?.[0]?.message?.content as string | undefined)?.trim() ?? "";
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
  const usage = json.usage ?? {};
  return {
    answer: (json.choices?.[0]?.message?.content as string | undefined) ?? "",
    generationId: json.id ?? null,
    provider: json.provider ?? null,
    model: json.model ?? null,
    finishReason: json.choices?.[0]?.finish_reason ?? null,
    tokensIn: usage.prompt_tokens ?? 0,
    tokensOut: usage.completion_tokens ?? 0,
    cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
    costUsd: typeof usage.cost === "number" ? usage.cost : null,
    ms: Math.round(performance.now() - started),
  };
}
