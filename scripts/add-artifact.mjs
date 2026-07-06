#!/usr/bin/env node
/*
  Add a React artifact to the viewer.
  Usage: npm run add -- /path/to/file.jsx [newName]
  Copies the file into src/artifacts/ (sanitizing the name).
*/
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { basename, extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = resolve(__dirname, "..", "src", "artifacts");

const src = process.argv[2];
if (!src) {
  console.error("Usage: npm run add -- /path/to/file.jsx [newName]");
  process.exit(1);
}
const srcPath = resolve(src);
if (!existsSync(srcPath)) {
  console.error(`File not found: ${srcPath}`);
  process.exit(1);
}

const rawName = process.argv[3] || basename(src, extname(src));
const safeName = rawName.replace(/[^a-zA-Z0-9-_]/g, "-");
const destPath = join(artifactsDir, `${safeName}.jsx`);

mkdirSync(artifactsDir, { recursive: true });
copyFileSync(srcPath, destPath);
console.log(`Added artifact: src/artifacts/${safeName}.jsx`);
console.log("It will appear in the viewer's picker automatically.");
