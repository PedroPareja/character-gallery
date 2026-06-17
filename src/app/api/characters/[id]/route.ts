import { db, schema } from "@/lib/db/init";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const character = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get();

  if (!character) {
    return NextResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const labels = db
    .select({ id: schema.labels.id, name: schema.labels.name, color: schema.labels.color })
    .from(schema.characterLabels)
    .innerJoin(schema.labels, eq(schema.characterLabels.labelId, schema.labels.id))
    .where(eq(schema.characterLabels.characterId, id))
    .all();

  const facePicCount = db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.characterId, id), eq(schema.images.type, "face")))
    .all().length;

  const bodyPicCount = db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.characterId, id), eq(schema.images.type, "body")))
    .all().length;

  return NextResponse.json({
    character: {
      id: character.id,
      name: character.name,
      bio: character.bio,
      labels,
      facePicCount,
      bodyPicCount,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, bio, labelIds } = body;

  const character = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get();

  if (!character) {
    return NextResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const updates: { name?: string; bio?: string; updatedAt: string } = { updatedAt: new Date().toISOString() };

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or less", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (bio !== undefined) {
    if (bio.length > 10000) {
      return NextResponse.json({ error: "Bio must be 10000 characters or less", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    updates.bio = bio;
  }

  db.update(schema.characters).set(updates).where(eq(schema.characters.id, id)).run();

  if (labelIds !== undefined) {
    db.delete(schema.characterLabels).where(eq(schema.characterLabels.characterId, id)).run();
    for (const labelId of labelIds) {
      const label = db.select().from(schema.labels).where(eq(schema.labels.id, labelId)).get();
      if (label) {
        db.insert(schema.characterLabels).values({ characterId: id, labelId }).run();
      }
    }
  }

  const updatedCharacter = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get()!;
  const labels = db
    .select({ id: schema.labels.id, name: schema.labels.name, color: schema.labels.color })
    .from(schema.characterLabels)
    .innerJoin(schema.labels, eq(schema.characterLabels.labelId, schema.labels.id))
    .where(eq(schema.characterLabels.characterId, id))
    .all();

  return NextResponse.json({
    character: {
      ...updatedCharacter,
      labels,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const character = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get();

  if (!character) {
    return NextResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const charImages = db.select().from(schema.images).where(eq(schema.images.characterId, id)).all();
  for (const img of charImages) {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "images", img.type, img.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.delete(schema.characters).where(eq(schema.characters.id, id)).run();

  return NextResponse.json({ success: true });
}
