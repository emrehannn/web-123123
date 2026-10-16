/**
 * Builds the responsive, pre-compressed variants of the About (hero) background.
 *
 * A full-viewport background is the page's LCP element, so it is encoded ahead of
 * time instead of on request: AVIF first, WebP second, a single JPEG as the plain
 * <img> fallback. Every width keeps 4:4:4 chroma so the violet gradient in the crowd
 * stays clean, and the source master (4K PNG) never ships to the browser.
 *
 * Usage:
 *   node scripts/build-hero-image.mjs
 *   node scripts/build-hero-image.mjs --src images/other.png --out public/images/hero --base other
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const srcPath = path.join(root, arg("src", "images/walkin-about-hero-4k.png"));
const outDir = path.join(root, arg("out", "public/images/hero"));
const base = arg("base", "walkin-about-hero");
const widths = arg("widths", "1280,1920,2560,3840")
  .split(",")
  .map((w) => Number(w.trim()))
  .filter(Boolean);

/** Fallback JPEG width: old browsers only, so one mid-size file is enough. */
const jpegWidth = Number(arg("jpeg-width", 1920));

const AVIF = { quality: 62, effort: 5, chromaSubsampling: "4:4:4" };
const WEBP = { quality: 90, effort: 5 };
const JPEG = { quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" };

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;

async function main() {
  if (!fs.existsSync(srcPath)) throw new Error(`Master not found: ${srcPath}`);
  fs.mkdirSync(outDir, { recursive: true });

  const meta = await sharp(srcPath).metadata();
  console.log(`source ${path.relative(root, srcPath)} ${meta.width}x${meta.height}`);

  const resized = (width) =>
    sharp(srcPath).removeAlpha().resize({ width, withoutEnlargement: true });

  for (const width of widths) {
    const file = (ext) => path.join(outDir, `${base}-${width}.${ext}`);

    const avif = await resized(width).avif(AVIF).toFile(file("avif"));
    const webp = await resized(width).webp(WEBP).toFile(file("webp"));

    console.log(`${width}px  avif ${kb(avif.size).padStart(8)}  webp ${kb(webp.size).padStart(8)}`);
  }

  const jpg = await resized(jpegWidth).jpeg(JPEG).toFile(path.join(outDir, `${base}-${jpegWidth}.jpg`));
  console.log(`${jpegWidth}px  jpeg ${kb(jpg.size).padStart(8)}  (fallback)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
