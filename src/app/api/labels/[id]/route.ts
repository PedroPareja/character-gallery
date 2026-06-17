import { db, schema } from "@/lib/db/init";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const label = db.select().from(schema.labels).where(eq(schema.labels.id, id)).get();

  if (!label) {
    return NextResponse.json({ error: "Label not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const characterCount = db
    .select()
    .from(schema.characterLabels)
    .where(eq(schema.characterLabels.labelId, id))
    .all().length;

  if (characterCount > 0) {
    return NextResponse.json(
      {
        error: "Label is assigned to characters. Use cascade delete to remove it from all characters.",
        code: "LABEL_HAS_CHARACTERS",
        characterCount,
      },
      { status: 409 }
    );
  }

  db.delete(schema.labels).where(eq(schema.labels.id, id)).run();

  return NextResponse.json({ success: true });
}
