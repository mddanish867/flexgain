import { randomUUID } from "node:crypto";
import { store } from "./store";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function saveImage(
  ownerId: string,
  file: File | Blob,
): Promise<{ id: string; mime: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/")) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  const id = randomUUID();
  store.images.set(id, { src: dataUrl, mime, uploadedAt: Date.now(), ownerId });
  return { id, mime };
}

export function getImage(
  id: string,
  ownerId?: string,
):
  | { src: string; mime: string; ownerId: string }
  | undefined {
  const img = store.images.get(id);
  if (!img) return undefined;
  if (ownerId && img.ownerId !== ownerId) return undefined;
  return img;
}

export function deleteImage(id: string, ownerId: string): boolean {
  const img = store.images.get(id);
  if (!img) return false;
  if (img.ownerId !== ownerId) return false;
  store.images.delete(id);
  return true;
}
