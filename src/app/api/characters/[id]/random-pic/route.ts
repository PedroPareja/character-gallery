import { db, schema } from "@/lib/db/init";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || (type !== "face" && type !== "body")) {
    return NextResponse.json(
      { error: "type query parameter is required and must be 'face' or 'body'", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const character = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get();

  if (!character) {
    return NextResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const targetImages = db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.characterId, id), eq(schema.images.type, type as "face" | "body")))
    .all();

  if (targetImages.length === 0) {
    return NextResponse.json({ imageUrl: null, imageId: null });
  }

  const randomImage = targetImages[Math.floor(Math.random() * targetImages.length)];
  return NextResponse.json({
    imageUrl: `/api/images/${type}/${randomImage.filename}`,
    imageId: randomImage.id,
  });
}
