import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filepath = path.join("/");

  if (!filepath.startsWith("face/") && !filepath.startsWith("body/")) {
    return NextResponse.json({ error: "Invalid path", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const fullPath = join(process.cwd(), "data", "images", filepath);

  try {
    const file = await readFile(fullPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found", code: "NOT_FOUND" }, { status: 404 });
  }
}
