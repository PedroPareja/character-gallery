import { db, schema } from "@/lib/db/init";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function GET() {
  const labels = db.select().from(schema.labels).all();

  const result = labels.map((label) => {
    const characterCount = db
      .select()
      .from(schema.characterLabels)
      .where(eq(schema.characterLabels.labelId, label.id))
      .all().length;

    return {
      id: label.id,
      name: label.name,
      color: label.color,
      characterCount,
    };
  });

  return NextResponse.json({ labels: result });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (name.length > 50) {
    return NextResponse.json({ error: "Name must be 50 characters or less", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const existing = db.select().from(schema.labels).where(eq(schema.labels.name, name.trim())).get();
  if (existing) {
    return NextResponse.json({ error: "Label already exists", code: "CONFLICT" }, { status: 409 });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  let finalColor = color;
  if (!finalColor) {
    finalColor = stringToColor(name);
  }

  db.insert(schema.labels).values({
    id,
    name: name.trim(),
    color: finalColor,
    createdAt: now,
  }).run();

  return NextResponse.json(
    {
      label: {
        id,
        name: name.trim(),
        color: finalColor,
        characterCount: 0,
      },
    },
    { status: 201 }
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
