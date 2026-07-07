import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeArtifactPath } from "./scripts/lib/delete-artifact.mjs";

const artifactsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "src/artifacts",
);

// Read and JSON-parse a request body (capped) without extra deps.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error("payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// Dev-only endpoint: POST /__delete-artifact { name } unlinks
// src/artifacts/<name>.jsx. Registered via configureServer ONLY, so it is
// absent from `vite build` and `vite preview`.
function deleteArtifactPlugin() {
  return {
    name: "delete-artifact",
    configureServer(server) {
      server.middlewares.use("/__delete-artifact", async (req, res, next) => {
        if (req.method !== "POST") return next();
        try {
          const { name } = await readJsonBody(req);
          const filePath = safeArtifactPath(artifactsDir, name);
          if (!filePath) return send(res, 400, { error: "invalid name" });
          if (!fs.existsSync(filePath)) return send(res, 404, { error: "not found" });
          await fs.promises.unlink(filePath);
          return send(res, 200, { ok: true });
        } catch {
          return send(res, 500, { error: "delete failed" });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), deleteArtifactPlugin()],
  server: {
    port: 5188,
    open: false,
  },
});
