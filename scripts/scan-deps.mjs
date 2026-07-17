#!/usr/bin/env node
/*
  Scan src/artifacts/*.{jsx,tsx} for bare (package) imports that are not present
  in package.json, and print a single `npm install` command for all of them.
  Usage: npm run scan-deps
  Exits non-zero when something is missing, so it can gate CI if desired.
*/
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const artifactsDir = join(repoRoot, "src", "artifacts");

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const installed = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

// Normalize an import specifier to its installable package name: keep an
// @scope, otherwise take the first path segment.
function pkgNameOf(spec) {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

const staticImport = /import\s+(?:[^"';]+\s+from\s+)?["']([^"']+)["']/g;
const dynamicImport = /import\(\s*["']([^"']+)["']\s*\)/g;

const missing = new Set();
let files = [];
try {
  files = readdirSync(artifactsDir).filter((f) => /\.(jsx|tsx)$/.test(f));
} catch {
  console.log("No artifacts directory found.");
  process.exit(0);
}

for (const file of files) {
  const code = readFileSync(join(artifactsDir, file), "utf8");
  for (const re of [staticImport, dynamicImport]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(code)) !== null) {
      const spec = m[1];
      if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("node:")) {
        continue; // relative or built-in
      }
      const name = pkgNameOf(spec);
      if (!installed.has(name)) missing.add(name);
    }
  }
}

const list = [...missing].sort();
if (list.length === 0) {
  console.log(`All artifact imports are installed (${files.length} files scanned).`);
  process.exit(0);
}

console.log("Missing dependencies imported by artifacts:");
console.log("  npm install " + list.join(" "));
process.exit(1);
