import { db, schema } from "@/lib/db/init";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST() {
  const tempDir = join(process.cwd(), "data", "temp-export-" + uuidv4());
  mkdirSync(tempDir, { recursive: true });
  mkdirSync(join(tempDir, "images", "face"), { recursive: true });
  mkdirSync(join(tempDir, "images", "body"), { recursive: true });

  const characters = db.select().from(schema.characters).all();
  const labels = db.select().from(schema.labels).all();
  const characterLabels = db.select().from(schema.characterLabels).all();
  const images = db.select().from(schema.images).all();

  const exportData = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      bio: c.bio,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    labels: labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      createdAt: l.createdAt,
    })),
    characterLabels: characterLabels.map((cl) => ({
      characterId: cl.characterId,
      labelId: cl.labelId,
    })),
    images: images.map((i) => ({
      id: i.id,
      characterId: i.characterId,
      type: i.type,
      filename: i.filename,
      originalName: i.originalName,
      createdAt: i.createdAt,
    })),
  };

  writeFileSync(join(tempDir, "export.json"), JSON.stringify(exportData, null, 2));

  for (const img of images) {
    const srcPath = join(process.cwd(), "data", "images", img.filename);
    const destPath = join(tempDir, "images", img.filename);
    if (existsSync(srcPath)) {
      cpSync(srcPath, destPath);
    }
  }

  const zip = new JSZip();
  zip.file("export.json", JSON.stringify(exportData, null, 2));

  const imagesFace = zip.folder("images/face");
  const imagesBody = zip.folder("images/body");

  for (const img of images) {
    const srcPath = join(process.cwd(), "data", "images", img.filename);
    if (existsSync(srcPath)) {
      const content = readFileSync(srcPath);
      if (img.type === "face" && imagesFace) {
        imagesFace.file(img.filename, content);
      } else if (img.type === "body" && imagesBody) {
        imagesBody.file(img.filename, content);
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });

  rmSync(tempDir, { recursive: true, force: true });

  return new NextResponse(new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" }), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="character-gallery-export-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}
