#!/usr/bin/env node
/**
 * Copy Ziva Pics from .tmp-ziva-pics to public/product-images with URL-safe names.
 * Run from project root after extracting the zip with Python (UTF-8):
 *   python3 -c "
 *   import zipfile, os
 *   z = zipfile.ZipFile('path/to/Ziva Pics-....zip')
 *   for i in z.infolist():
 *     n = i.filename.encode('cp437').decode('utf-8')
 *     t = os.path.join('.tmp-ziva-pics', n)
 *     (os.makedirs(os.path.dirname(t), exist_ok=True) if not i.is_dir() else os.makedirs(t, exist_ok=True))
 *     (open(t, 'wb').write(z.open(i).read()) if not i.is_dir() else None)
 *   "
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, ".tmp-ziva-pics", "Ziva Pics");
const DEST = path.join(ROOT, "public", "product-images");

function slug(name) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents → decor
      .replace(/\s+/g, "-")
      .replace(/[&+]/g, "and")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // emoji
      .replace(/[^\w.-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^\-|\-$/g, "") || "image"
  );
}

const map = [
  { srcDir: "GARDEN", destDir: "garden", prefix: "garden-" },
  { srcDir: "LANDSCAPING ", destDir: "landscaping", prefix: "landscaping-" },
  { srcDir: "Funiture and Fittings", destDir: "furniture", prefix: "furniture-" },
  { srcDir: "Home dècor and Furnishing", destDir: "home-decor", prefix: "home-decor-" },
];

const seen = new Set();
function copyDir(srcDir, destDir, prefix = "") {
  if (!fs.existsSync(srcDir)) return [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const copied = [];
  for (const e of entries) {
    const srcPath = path.join(srcDir, e.name);
    if (e.isDirectory()) {
      copied.push(
        ...copyDir(
          srcPath,
          destDir,
          prefix + slug(e.name) + "-"
        )
      );
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(e.name)) {
      const base = path.basename(e.name, path.extname(e.name));
      const ext = path.extname(e.name).toLowerCase();
      const safeName = slug(base) || "img";
      let destName = (prefix + safeName).replace(/-+/g, "-").replace(/^-/, "") + ext;
      if (seen.has(destName)) {
        destName = (prefix + safeName + "-" + copied.length).replace(/-+/g, "-").replace(/^-/, "") + ext;
      }
      seen.add(destName);
      const destPath = path.join(destDir, destName);
      fs.copyFileSync(srcPath, destPath);
      copied.push(path.join("product-images", path.basename(destDir), destName));
    }
  }
  return copied;
}

const all = [];
for (const { srcDir, destDir, prefix } of map) {
  const src = path.join(SRC, srcDir);
  const dest = path.join(DEST, destDir);
  if (fs.existsSync(src)) {
    const files = copyDir(src, dest, prefix);
    all.push(...files.map((f) => "/" + f));
  }
}
console.log("Copied", all.length, "images:");
all.forEach((f) => console.log(" ", f));
module.exports = { copied: all };
