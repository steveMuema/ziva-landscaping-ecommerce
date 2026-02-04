#!/usr/bin/env node
/**
 * Extract Ziva Pics zip with correct UTF-8 filenames (zip often uses CP437).
 * Usage: node scripts/extract-ziva-pics-zip.js [path/to/Ziva Pics-....zip]
 * Default: ~/Downloads/Ziva Pics-20260204T204101Z-3-001.zip
 * Then run: node scripts/copy-ziva-pics.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const defaultZip = path.join(
  process.env.HOME || "/tmp",
  "Downloads",
  "Ziva Pics-20260204T204101Z-3-001.zip"
);
const zipPath = path.resolve(process.argv[2] || defaultZip);
const outDir = path.join(ROOT, ".tmp-ziva-pics");

if (!fs.existsSync(zipPath)) {
  console.error("Zip not found:", zipPath);
  process.exit(1);
}

const pyScript = path.join(ROOT, ".tmp-ziva-pics-extract.py");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  pyScript,
  `
import zipfile
import os
zip_path = ${JSON.stringify(zipPath)}
out_dir = ${JSON.stringify(outDir)}
z = zipfile.ZipFile(zip_path)
for i in z.infolist():
    try:
        name = i.filename.encode("cp437").decode("utf-8")
    except Exception:
        name = i.filename
    target = os.path.join(out_dir, name)
    if i.is_dir():
        os.makedirs(target, exist_ok=True)
    else:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with z.open(i) as src, open(target, "wb") as dst:
            dst.write(src.read())
    print(name[:70])
z.close()
`,
  "utf8"
);
try {
  execSync(`python3 "${pyScript}"`, { stdio: "inherit", cwd: ROOT });
  fs.unlinkSync(pyScript);
  console.log("\nExtracted to .tmp-ziva-pics. Run: node scripts/copy-ziva-pics.js");
} catch (e) {
  try {
    fs.unlinkSync(pyScript);
  } catch (_) {}
  process.exit(1);
}
