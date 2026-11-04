import { db, schema } from "@/lib/db/init";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const labelFilter = searchParams.get("labels")?.split(",").filter(Boolean) || [];
  const excludeLabelFilter =
    searchParams.get("excludeLabels")?.split(",").filter(Boolean) || [];

  let characters;

  if (labelFilter.length > 0) {
    const characterIds = db
      .select({ characterId: schema.characterLabels.characterId })
      .from(schema.characterLabels)
      .where(inArray(schema.characterLabels.labelId, labelFilter))
      .all()
      .map((r) => r.characterId);

    if (characterIds.length === 0) {
      return NextResponse.json(
        { error: "No characters match the current filter", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    characters = db
      .select()
      .from(schema.characters)
      .where(inArray(schema.characters.id, [...new Set(characterIds)]))
      .all();
  } else {
    characters = db.select().from(schema.characters).all();
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

  if (characters.length === 0) {
    return NextResponse.json(
      { error: "No characters match the current filter", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
  return NextResponse.json({ characterId: randomCharacter.id });
}
