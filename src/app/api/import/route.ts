import { db, schema } from "@/lib/db/init";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync, cpSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import type { ExportData } from "@/lib/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const mode = formData.get("mode") as string;

  if (!file) {
    return NextResponse.json({ error: "No file provided", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (mode !== "replace" && mode !== "merge") {
    return NextResponse.json({ error: "mode must be 'replace' or 'merge'", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const tempDir = join(process.cwd(), "data", "temp-import-" + uuidv4());
  mkdirSync(tempDir, { recursive: true });

  try {
    const filePath = join(tempDir, "import.zip");
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    const { exec } = await import("child_process");
    await new Promise<void>((resolve, reject) => {
      exec(`unzip -o "${filePath}" -d "${tempDir}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const exportJsonPath = join(tempDir, "export.json");
    if (!existsSync(exportJsonPath)) {
      return NextResponse.json({ error: "Invalid import file: missing export.json", code: "INVALID_IMPORT" }, { status: 400 });
    }

    const exportData: ExportData = JSON.parse(readFileSync(exportJsonPath, "utf-8"));

    if (exportData.version !== 1) {
      return NextResponse.json({ error: "Unsupported export version", code: "INVALID_IMPORT" }, { status: 400 });
    }

    if (mode === "replace") {
      rmSync(join(process.cwd(), "data", "images", "face"), { recursive: true, force: true });
      rmSync(join(process.cwd(), "data", "images", "body"), { recursive: true, force: true });
      mkdirSync(join(process.cwd(), "data", "images", "face"), { recursive: true });
      mkdirSync(join(process.cwd(), "data", "images", "body"), { recursive: true });

      db.delete(schema.characterLabels).run();
      db.delete(schema.images).run();
      db.delete(schema.characters).run();
      db.delete(schema.labels).run();

      for (const label of exportData.labels) {
        db.insert(schema.labels).values(label).run();
      }

      for (const character of exportData.characters) {
        db.insert(schema.characters).values(character).run();
      }

      for (const cl of exportData.characterLabels) {
        db.insert(schema.characterLabels).values(cl).run();
      }

      for (const img of exportData.images) {
        db.insert(schema.images).values(img).run();
      }
    } else {
      let labelsImported = 0;
      for (const label of exportData.labels) {
        const existing = db.select().from(schema.labels).where(eq(schema.labels.id, label.id)).get();
        if (!existing) {
          db.insert(schema.labels).values(label).run();
          labelsImported++;
        }
      }

      let charactersImported = 0;
      for (const character of exportData.characters) {
        const existing = db.select().from(schema.characters).where(eq(schema.characters.id, character.id)).get();
        if (!existing) {
          db.insert(schema.characters).values(character).run();
          charactersImported++;
        }
      }

      for (const cl of exportData.characterLabels) {
        const existing = db
          .select()
          .from(schema.characterLabels)
          .where(and(eq(schema.characterLabels.characterId, cl.characterId), eq(schema.characterLabels.labelId, cl.labelId)))
          .get();
        if (!existing) {
          db.insert(schema.characterLabels).values(cl).run();
        }
      }

      let imagesImported = 0;
      for (const img of exportData.images) {
        const existing = db.select().from(schema.images).where(eq(schema.images.id, img.id)).get();
        if (!existing) {
          db.insert(schema.images).values(img).run();
          imagesImported++;
        }
      }

      const imagesDir = join(tempDir, "images");
      if (existsSync(imagesDir)) {
        const faceSrc = join(imagesDir, "face");
        const faceDest = join(process.cwd(), "data", "images", "face");
        if (existsSync(faceSrc)) {
          cpSync(faceSrc, faceDest, { recursive: true });
        }

        const bodySrc = join(imagesDir, "body");
        const bodyDest = join(process.cwd(), "data", "images", "body");
        if (existsSync(bodySrc)) {
          cpSync(bodySrc, bodyDest, { recursive: true });
        }
      }

      return NextResponse.json({
        success: true,
        stats: {
          charactersImported,
          labelsImported,
          imagesImported,
        },
      });
    }

    const imagesDir = join(tempDir, "images");
    if (existsSync(imagesDir)) {
      const faceSrc = join(imagesDir, "face");
      const faceDest = join(process.cwd(), "data", "images", "face");
      if (existsSync(faceSrc)) {
        cpSync(faceSrc, faceDest, { recursive: true });
      }

      const bodySrc = join(imagesDir, "body");
      const bodyDest = join(process.cwd(), "data", "images", "body");
      if (existsSync(bodySrc)) {
        cpSync(bodySrc, bodyDest, { recursive: true });
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        charactersImported: exportData.characters.length,
        labelsImported: exportData.labels.length,
        imagesImported: exportData.images.length,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import data", code: "INVALID_IMPORT" }, { status: 400 });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
