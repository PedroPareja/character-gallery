import { db, schema } from "@/lib/db/init";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, color } = body;

  const label = db.select().from(schema.labels).where(eq(schema.labels.id, id)).get();

  if (!label) {
    return NextResponse.json({ error: "Label not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const updates: { name?: string; color?: string | null } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (color !== undefined) {
    updates.color = color || null;
  }

  if (Object.keys(updates).length > 0) {
    db.update(schema.labels).set(updates).where(eq(schema.labels.id, id)).run();
  }

  const updated = db.select().from(schema.labels).where(eq(schema.labels.id, id)).get();

  return NextResponse.json({ label: updated });
}

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
