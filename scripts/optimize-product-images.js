#!/usr/bin/env node
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "product-images");
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 82;

function walk(dir) {
  let files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(p));
    else if (/\.(jpg|jpeg|png)$/i.test(e.name)) files.push(p);
  }
  return files;
}

async function main() {
  if (!fs.existsSync(DIR)) return;
  const files = walk(DIR);
  for (const fp of files) {
    const ext = path.extname(fp).toLowerCase();
    const buf = fs.readFileSync(fp);
    let out = sharp(buf);
    const meta = await out.metadata();
    const w = meta.width || 0;
    const resize = w > MAX_WIDTH ? { width: MAX_WIDTH } : {};
    if (Object.keys(resize).length) out = out.resize(resize);
    if (ext === ".png") out = out.png({ compressionLevel: 6 });
    else out = out.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    await out.toFile(fp);
  }
  console.log("Optimized", files.length, "images");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
