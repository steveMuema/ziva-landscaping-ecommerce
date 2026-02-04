#!/usr/bin/env node
/**
 * Copy Ziva Pics from .tmp-ziva-pics to public/product-images with URL-safe names.
 * Run from project root after extracting the zip to .tmp-ziva-pics.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, ".tmp-ziva-pics", "Ziva Pics");
const DEST = path.join(ROOT, "public", "product-images");

function slug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[&+]/g, "and")
    .replace(/[^\w.-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^\-|\-$/g, "") || "image";
}

const map = [
  { srcDir: "GARDEN/Fruits", destDir: "garden", prefix: "garden-" },
  { srcDir: "LANDSCAPING ", destDir: "landscaping", prefix: "landscaping-", skipDirs: false },
  { srcDir: "Funiture and Fittings", destDir: "furniture", prefix: "furniture-" },
];

function copyDir(srcDir, destDir, prefix = "") {
  if (!fs.existsSync(srcDir)) return [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const copied = [];
  for (const e of entries) {
    const srcPath = path.join(srcDir, e.name);
    if (e.isDirectory()) {
      copied.push(...copyDir(srcPath, destDir, prefix + e.name.toLowerCase().replace(/\s+/g, "-") + "-"));
    } else if (/\.(jpg|jpeg|png|webp|svg)$/i.test(e.name)) {
      const base = path.basename(e.name, path.extname(e.name));
      const ext = path.extname(e.name).toLowerCase();
      const safeName = slug(base) || "img";
      const destName = (prefix + safeName).replace(/-+/g, "-").replace(/^-/, "") + ext;
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
