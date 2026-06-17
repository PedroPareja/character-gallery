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

  db.delete(schema.characterLabels).where(eq(schema.characterLabels.labelId, id)).run();
  db.delete(schema.labels).where(eq(schema.labels.id, id)).run();

  return NextResponse.json({ success: true });
}
