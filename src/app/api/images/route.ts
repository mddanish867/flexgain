import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { MAX_IMAGE_BYTES, saveImage } from "@/lib/imageStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image too large (max 5MB)" },
      { status: 413 },
    );
  }
  try {
    const saved = await saveImage(user.id, file);
    return NextResponse.json({
      id: saved.id,
      mime: saved.mime,
      url: `/api/images/${saved.id}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    if (msg === "IMAGE_TOO_LARGE") {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }
    if (msg === "UNSUPPORTED_MEDIA_TYPE") {
      return NextResponse.json(
        { error: "Only image uploads are allowed" },
        { status: 415 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
