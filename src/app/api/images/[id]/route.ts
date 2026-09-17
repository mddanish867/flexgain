import { NextResponse } from "next/server";
import { getImage, deleteImage } from "@/lib/imageStore";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const img = getImage(id);
  if (!img) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Extract base64 payload from data URL
  const m = img.src.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    return NextResponse.json({ error: "Corrupt image" }, { status: 500 });
  }
  const mime = m[1]!;
  const b64 = m[2]!;
  const buf = Buffer.from(b64, "base64");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = deleteImage(id, user.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
