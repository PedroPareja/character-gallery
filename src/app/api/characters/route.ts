import { db, schema } from "@/lib/db/init";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import type { CharacterWithLabels, PicType } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const labelFilter = searchParams.get("labels")?.split(",").filter(Boolean) || [];
  const excludeLabelFilter =
    searchParams.get("excludeLabels")?.split(",").filter(Boolean) || [];
  const picSet = (searchParams.get("picSet") as PicType) || "face";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const labelFilterMode = searchParams.get("labelFilterMode") || "AND";
  const nameFilter = (searchParams.get("name") || "").trim().toLowerCase();

  let characters;

  if (labelFilter.length > 0) {
    let characterIds: string[];

    if (labelFilterMode === "AND") {
      const sets = labelFilter.map((labelId) => {
        return db
          .select({ characterId: schema.characterLabels.characterId })
          .from(schema.characterLabels)
          .where(eq(schema.characterLabels.labelId, labelId))
          .all()
          .map((r) => r.characterId);
      });

      characterIds = sets.reduce((acc, set) =>
        acc.filter((id) => set.includes(id))
      );
    } else {
      characterIds = db
        .select({ characterId: schema.characterLabels.characterId })
        .from(schema.characterLabels)
        .where(inArray(schema.characterLabels.labelId, labelFilter))
        .all()
        .map((r) => r.characterId);
    }

    if (characterIds.length === 0) {
      return NextResponse.json({ characters: [] });
    }

    characters = db
      .select()
      .from(schema.characters)
      .where(inArray(schema.characters.id, [...new Set(characterIds)]))
      .all();
  } else {
    characters = db.select().from(schema.characters).all();
  }

  if (nameFilter) {
    characters = characters.filter((char) => char.name.toLowerCase().includes(nameFilter));
  }

  if (excludeLabelFilter.length > 0) {
    const excludedCharacterIds = new Set(
      db
        .select({ characterId: schema.characterLabels.characterId })
        .from(schema.characterLabels)
        .where(inArray(schema.characterLabels.labelId, excludeLabelFilter))
        .all()
        .map((r) => r.characterId)
    );
    characters = characters.filter((char) => !excludedCharacterIds.has(char.id));
  }

  if (sortBy === "name") {
    characters.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  } else if (sortBy === "createdAt") {
    characters.sort((a, b) =>
      sortOrder === "asc"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
  } else if (sortBy === "random") {
    for (let i = characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [characters[i], characters[j]] = [characters[j], characters[i]];
    }
  }

  const result: CharacterWithLabels[] = characters.map((char) => {
    const labels = db
      .select({
        id: schema.labels.id,
        name: schema.labels.name,
        color: schema.labels.color,
      })
      .from(schema.characterLabels)
      .innerJoin(schema.labels, eq(schema.characterLabels.labelId, schema.labels.id))
      .where(eq(schema.characterLabels.characterId, char.id))
      .all();

    const faceImages = db
      .select()
      .from(schema.images)
      .where(and(eq(schema.images.characterId, char.id), eq(schema.images.type, "face")))
      .all();

    const bodyImages = db
      .select()
      .from(schema.images)
      .where(and(eq(schema.images.characterId, char.id), eq(schema.images.type, "body")))
      .all();

    const targetImages = picSet === "face" ? faceImages : bodyImages;
    const randomPicUrl =
      targetImages.length > 0
        ? `/api/images/${picSet}/${targetImages[Math.floor(Math.random() * targetImages.length)].filename}`
        : null;

    return {
      id: char.id,
      name: char.name,
      bio: char.bio,
      labels,
      randomPicUrl,
      facePicCount: faceImages.length,
      bodyPicCount: bodyImages.length,
      createdAt: char.createdAt,
      updatedAt: char.updatedAt,
    };
  });

  return NextResponse.json({ characters: result });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, bio = "", labelIds = [] } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or less", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (bio.length > 10000) {
    return NextResponse.json({ error: "Bio must be 10000 characters or less", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.insert(schema.characters).values({
    id,
    name: name.trim(),
    bio,
    createdAt: now,
    updatedAt: now,
  }).run();

  for (const labelId of labelIds) {
    const label = db.select().from(schema.labels).where(eq(schema.labels.id, labelId)).get();
    if (label) {
      db.insert(schema.characterLabels).values({ characterId: id, labelId }).run();
    }
  }

  const labels = db
    .select({ id: schema.labels.id, name: schema.labels.name, color: schema.labels.color })
    .from(schema.characterLabels)
    .innerJoin(schema.labels, eq(schema.characterLabels.labelId, schema.labels.id))
    .where(eq(schema.characterLabels.characterId, id))
    .all();

  return NextResponse.json(
    {
      character: {
        id,
        name: name.trim(),
        bio,
        labels,
        createdAt: now,
        updatedAt: now,
      },
    },
    { status: 201 }
  );
}
