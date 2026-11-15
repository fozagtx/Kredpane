const BASE_URL = "https://inference-api.openserv.ai/v1";
const MODEL = process.env.SERV_SUPPORT_MODEL || "gpt-5.4";
const KEY = process.env.SERV_API_KEY;

export const servConfigured = Boolean(KEY);

export async function transcribeImage(dataUri: string): Promise<string> {
  if (!KEY) throw new Error("SERV_API_KEY is not set");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            "Transcribe every word of text visible in the image, preserving line breaks. Output the transcribed text only, with no commentary. If the image contains no text, output nothing."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe this document." },
            { type: "image_url", image_url: { url: dataUri } }
          ]
        }
      ]
    }),
    signal: AbortSignal.timeout(120000)
  });
  if (!res.ok) throw new Error(`SERV ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("no text found in the image");
  return content;
}

export async function chatText({
  system,
  messages,
  temperature = 0.7
}: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
}): Promise<string> {
  if (!KEY) throw new Error("SERV_API_KEY is not set");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_completion_tokens: 400,
      messages: [{ role: "system", content: system }, ...messages]
    }),
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error(`SERV ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("SERV returned an empty reply");
  return content;
}
