import { randomUUID } from "node:crypto";
import { query } from "./db";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageRow {
  id: string;
  owner_id: string;
  mime: string;
  data: Buffer;
  uploaded_at: string;
}

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
  const id = randomUUID();
  await query(
    `INSERT INTO images (id, owner_id, mime, data, uploaded_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, ownerId, mime, buf, Date.now()],
  );
  return { id, mime };
}

export async function getImage(
  id: string,
  ownerId?: string,
): Promise<{ data: Buffer; mime: string; ownerId: string } | undefined> {
  const rows = await query<ImageRow>("SELECT * FROM images WHERE id = $1", [id]);
  const img = rows[0];
  if (!img) return undefined;
  if (ownerId && img.owner_id !== ownerId) return undefined;
  return { data: img.data, mime: img.mime, ownerId: img.owner_id };
}

export async function deleteImage(id: string, ownerId: string): Promise<boolean> {
  const rows = await query(
    "DELETE FROM images WHERE id = $1 AND owner_id = $2 RETURNING id",
    [id, ownerId],
  );
  return rows.length > 0;
}
