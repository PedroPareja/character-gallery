import { db, schema } from "@/lib/db/init";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;

  const image = db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.id, imageId), eq(schema.images.characterId, id)))
    .get();

  if (!image) {
    return NextResponse.json({ error: "Image not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const filePath = join(process.cwd(), "data", "images", image.type, image.filename);
  try {
    await unlink(filePath);
  } catch {
  }

  db.delete(schema.images).where(eq(schema.images.id, imageId)).run();

  return NextResponse.json({ success: true });
}
