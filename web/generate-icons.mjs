import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "public/icon.svg");

const sizes = [
  { size: 192, name: "pwa-192x192.png" },
  { size: 512, name: "pwa-512x512.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32,  name: "favicon-32x32.png" },
  { size: 16,  name: "favicon-16x16.png" },
];

for (const { size, name } of sizes) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, "public", name));
  console.log(`Generated ${name} (${size}x${size})`);
}
