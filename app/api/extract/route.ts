import { extractText, getDocumentProxy } from "unpdf";
import { transcribeImage } from "../../../lib/serv";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "no file uploaded" }, { status: 400 });
  if (file.size === 0) return Response.json({ error: "file is empty" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "file is larger than 8 MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (file.type === "application/pdf") {
      const doc = await getDocumentProxy(new Uint8Array(buffer));
      const { totalPages, text } = await extractText(doc, { mergePages: true });
      const clean = String(text).trim();
      if (clean.length < 40) {
        return Response.json(
          { error: "this PDF has no text layer (it looks scanned). Upload a photo of the page instead." },
          { status: 422 }
        );
      }
      return Response.json({ text: clean, kind: "pdf", pages: totalPages, chars: clean.length, name: file.name });
    }

    if (IMAGE_TYPES.includes(file.type)) {
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
      const text = await transcribeImage(dataUri);
      return Response.json({ text, kind: "image", pages: 1, chars: text.length, name: file.name });
    }

    return Response.json({ error: "unsupported file type — upload a PDF, PNG, JPEG or WebP" }, { status: 415 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
