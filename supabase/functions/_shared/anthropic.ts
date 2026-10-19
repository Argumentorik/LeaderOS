const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

export async function complete(args: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      system: args.system,
      messages: args.messages,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 400)}`);
  }
  const json = await res.json() as {
    content: Array<{ type: string; text?: string }>;
  };
  return json.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("");
}

export async function stream(args: {
  model: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<ReadableStream<Uint8Array>> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      system: args.system,
      messages: args.messages,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.7,
      stream: true,
    }),
  });
  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text();
    throw new Error(`Anthropic stream ${upstream.status}: ${t.slice(0, 400)}`);
  }
  return upstream.body;
}
