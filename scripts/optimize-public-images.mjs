#!/usr/bin/env node
/**
 * Lossless-ish recompression for large photo assets under public/.
 * Keeps filenames/extensions so call sites do not need updates.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public");
const MAX_EDGE = 1920;
const MIN_BYTES = 250_000;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

async function optimizeFile(file) {
  const before = (await stat(file)).size;
  if (before < MIN_BYTES) return null;

  const ext = path.extname(file).toLowerCase();
  const image = sharp(file, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const needsResize = Math.max(width, height) > MAX_EDGE;

  let pipeline = image;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: width >= height ? MAX_EDGE : undefined,
      height: height > width ? MAX_EDGE : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const { rename, unlink } = await import("node:fs/promises");

  // Photographic PNGs compress poorly as PNG — emit WebP beside them and drop the PNG.
  if (ext === ".png" && before >= 400_000) {
    const webpPath = file.replace(/\.png$/i, ".webp");
    await pipeline.webp({ quality: 80 }).toFile(webpPath);
    const after = (await stat(webpPath)).size;
    await unlink(file);
    return { file: webpPath, before, after, skipped: false, replaced: file };
  }

  const tmp = `${file}.tmp-opt`;
  if (ext === ".png") {
    await pipeline.png({ compressionLevel: 9, palette: false }).toFile(tmp);
  } else if (ext === ".webp") {
    await pipeline.webp({ quality: 82 }).toFile(tmp);
  } else {
    await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(tmp);
  }

  const after = (await stat(tmp)).size;
  if (after >= before * 0.98) {
    await unlink(tmp);
    return { file, before, after: before, skipped: true };
  }

  await rename(tmp, file);
  return { file, before, after, skipped: false };
}

const files = await walk(ROOT);
let saved = 0;
for (const file of files) {
  try {
    const result = await optimizeFile(file);
    if (!result) continue;
    const delta = result.before - result.after;
    saved += delta;
    const rel = path.relative(process.cwd(), result.file);
    if (result.skipped) {
      console.log(`skip  ${rel} (${result.before} bytes)`);
    } else if (result.replaced) {
      console.log(
        `webp  ${path.relative(process.cwd(), result.replaced)} -> ${rel}: ${result.before} -> ${result.after} (-${Math.round((delta / result.before) * 100)}%)`
      );
    } else {
      console.log(
        `opt   ${rel}: ${result.before} -> ${result.after} (-${Math.round((delta / result.before) * 100)}%)`
      );
    }
  } catch (error) {
    console.warn(`fail  ${file}:`, error instanceof Error ? error.message : error);
  }
}

console.log(`Done. Saved ~${Math.round(saved / 1024)} KiB`);
