import { NextResponse } from "next/server";
import { getImage, deleteImage } from "@/lib/imageStore";
import { getCurrentUser } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  // Uploads are private. Browsers send the session cookie on same-origin
  // <img> requests, so scoping by owner still renders the exercise cards.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  // Passing the owner makes a cross-user read indistinguishable from a
  // missing image, so this can't be used to probe for valid ids.
  const img = await getImage(id, user.id);
  if (!img) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(img.data), {
    status: 200,
    headers: {
      "Content-Type": img.mime,
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
  const ok = await deleteImage(id, user.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
