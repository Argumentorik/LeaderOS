const VOYAGE_API_KEY = Deno.env.get("VOYAGE_API_KEY")!;
// Voyage-Modell-Name lebt canonical in backend/services_rag.py
// (VOYAGE_MODEL Konstante). Hier nur über env, KEIN String-Fallback —
// siehe .github/workflows/constants-drift.yml. Sonst entstehen wieder
// Doppel-Wahrheiten zwischen Python und Edge-Functions.
const VOYAGE_MODEL = Deno.env.get("VOYAGE_MODEL");

export async function embed(
  texts: string[],
  inputType: "query" | "document" = "query",
): Promise<number[][]> {
  if (!VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY not configured");
  }
  if (!VOYAGE_MODEL) {
    throw new Error(
      "VOYAGE_MODEL env var is required. Set it in Supabase Edge-Function-Secrets " +
        "to the same value as VOYAGE_MODEL in backend/services_rag.py.",
    );
  }
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: 1024,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Voyage API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data.map((d) => d.embedding);
}
