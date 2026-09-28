import "server-only";

// The model behind the assistant, through OpenRouter's OpenAI-compatible API.
// No web search: OpenRouter only searches when a request asks for its web
// plugin (or a ":online" model), and these never do.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Claude Haiku, latest. OPENROUTER_MODEL overrides it, e.g. to try another model. */
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

type ContentPart = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };

export type ModelMessage =
  | { role: "system"; content: string | ContentPart[] }
  | { role: "user" | "assistant"; content: string };

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
