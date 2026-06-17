import { db, schema } from "@/lib/db/init";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join } from "path";

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

  const images = db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.characterId, id), eq(schema.images.type, type as "face" | "body")))
    .all();

  return NextResponse.json({
    images: images.map((img) => ({
      id: img.id,
      url: `/api/images/${type}/${img.filename}`,
      originalName: img.originalName,
      createdAt: img.createdAt,
    })),
  });
}

async function processImage(file: File, imageId: string, imageDir: string, type: "face" | "body", characterId: string) {
  const filename = `${imageId}.webp`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await sharp(buffer)
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(join(imageDir, filename));

  const now = new Date().toISOString();
  db.insert(schema.images).values({
    id: imageId,
    characterId: characterId,
    type,
    filename,
    originalName: file.name,
    createdAt: now,
  }).run();

  return {
    id: imageId,
    url: `/api/images/${type}/${filename}`,
    originalName: file.name,
    createdAt: now,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const character = db.select().from(schema.characters).where(eq(schema.characters.id, id)).get();

  if (!character) {
    return NextResponse.json({ error: "Character not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const formData = await request.formData();
  const type = formData.get("type") as string;
  const files = formData.getAll("files") as File[];

  if (!type || (type !== "face" && type !== "body")) {
    return NextResponse.json(
      { error: "type field is required and must be 'face' or 'body'", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (files.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 files per request", code: "TOO_MANY_FILES" },
      { status: 400 }
    );
  }

  const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: png, jpg, gif, webp`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 10MB limit`, code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }
  }

  const imageDir = join(process.cwd(), "data", "images", type);
  await mkdir(imageDir, { recursive: true });

  const imageIds = files.map(() => uuidv4());

  const processPromises = files.map((file, index) =>
    processImage(file, imageIds[index], imageDir, type as "face" | "body", id)
  );

  const createdImages = await Promise.all(processPromises);

  db.update(schema.characters)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(schema.characters.id, id))
    .run();

  return NextResponse.json({ images: createdImages }, { status: 201 });
}
