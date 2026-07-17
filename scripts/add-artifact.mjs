#!/usr/bin/env node
/*
  Add a React artifact to the viewer.
  Usage: npm run add -- /path/to/file.jsx [newName] [--open]
  Copies the file into src/artifacts/ (sanitizing the name).
  With --open, also opens the default browser to the artifact's deep link.
*/
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { basename, extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openUrl } from "./lib/open-url.mjs";

const PORT = 5188;
const BASE_URL = `http://localhost:${PORT}`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = resolve(__dirname, "..", "src", "artifacts");

// Split flags from positional args so --open works before or after the path.
const argv = process.argv.slice(2);
const open = argv.includes("--open");
const positionals = argv.filter((a) => !a.startsWith("--"));

const src = positionals[0];
if (!src) {
  console.error("Usage: npm run add -- /path/to/file.jsx [newName] [--open]");
  process.exit(1);
}
const srcPath = resolve(src);
if (!existsSync(srcPath)) {
  console.error(`File not found: ${srcPath}`);
  process.exit(1);
}

const srcExt = extname(src).toLowerCase();
const ext = srcExt === ".tsx" ? ".tsx" : ".jsx";
const rawName = positionals[1] || basename(src, extname(src));
const safeName = rawName.replace(/[^a-zA-Z0-9-_]/g, "-");
const destPath = join(artifactsDir, `${safeName}${ext}`);

mkdirSync(artifactsDir, { recursive: true });
copyFileSync(srcPath, destPath);
console.log(`Added artifact: src/artifacts/${safeName}${ext}`);
console.log("It will appear in the viewer's picker automatically.");

if (open) {
  // Open the artifact's deep link (best effort). This does not start the dev
  // server; run `npm run dev` (or `npm run view`) for that. Print the URL too.
  const url = `${BASE_URL}/?artifact=${safeName}`;
  openUrl(url);
  console.log(`Open: ${url}`);
}
