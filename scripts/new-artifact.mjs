#!/usr/bin/env node
/*
  Scaffold a new React artifact for the viewer.
  Usage: npm run new -- <name>
  Creates src/artifacts/<name>.jsx from a minimal, renderable template.
*/
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactsDir = resolve(__dirname, "..", "src", "artifacts");

const rawName = process.argv[2];
if (!rawName) {
  console.error("Usage: npm run new -- <name>");
  process.exit(1);
}

const safeName = rawName.replace(/[^a-zA-Z0-9-_]/g, "-");
const destPath = join(artifactsDir, `${safeName}.jsx`);

if (existsSync(destPath)) {
  console.error(`Artifact already exists: src/artifacts/${safeName}.jsx`);
  console.error("Refusing to overwrite. Choose a different name.");
  process.exit(1);
}

const componentName =
  safeName
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") || "Artifact";

const template = `import React, { useState } from "react";
import { Sparkles } from "lucide-react";

export default function ${componentName}() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        background: "#F6F4EE",
        color: "#1C1A15",
      }}
    >
      <Sparkles size={32} color="#1F6F5C" />
      <h1 style={{ margin: 0, fontSize: 28 }}>${componentName}</h1>
      <p style={{ margin: 0, color: "#55503F" }}>
        A fresh artifact. Edit me and watch it hot reload.
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: "10px 20px",
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #C7C0A8",
          background: "#FCFBF7",
          color: "#1C1A15",
          cursor: "pointer",
        }}
      >
        Clicked {count} {count === 1 ? "time" : "times"}
      </button>
    </div>
  );
}
`;

mkdirSync(artifactsDir, { recursive: true });
writeFileSync(destPath, template, "utf8");
console.log(`Created artifact: src/artifacts/${safeName}.jsx`);
console.log("It will appear in the viewer's picker automatically.");
