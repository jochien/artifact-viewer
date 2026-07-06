#!/usr/bin/env node
/*
  View a React artifact in one command.
  Usage: npm run view -- /path/to/file.jsx

  Copies the file into src/artifacts/ (sanitizing the name the same way add does),
  ensures the dev server is running on port 5188 (reusing it if already up), and
  opens the default browser to http://localhost:5188/?artifact=<name>.
*/
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { basename, extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { get } from "node:http";
import { openUrl } from "./lib/open-url.mjs";

const PORT = 5188;
const BASE_URL = `http://localhost:${PORT}`;

// Probe the dev server with a single HTTP GET against a specific host.
function probeHost(host, port) {
  return new Promise((resolvePromise) => {
    const req = get({ host, port, path: "/" }, (res) => {
      res.resume();
      resolvePromise(true);
    });
    req.on("error", () => resolvePromise(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolvePromise(false);
    });
  });
}

// Is the dev server up on this port? Check both IPv4 and IPv6 loopback, since
// Vite may bind only one family (on macOS it commonly binds IPv6 [::1] only).
async function probeServer(port) {
  const [v4, v6] = await Promise.all([
    probeHost("127.0.0.1", port),
    probeHost("::1", port),
  ]);
  return v4 || v6;
}

// Poll the server until it responds or we time out.
async function waitForServer(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probeServer(port)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(__dirname, "..");
  const artifactsDir = resolve(repoRoot, "src", "artifacts");

  const src = process.argv[2];
  if (!src) {
    console.error("Usage: npm run view -- /path/to/file.jsx");
    process.exit(1);
  }
  const srcPath = resolve(src);
  if (!existsSync(srcPath)) {
    console.error(`File not found: ${srcPath}`);
    process.exit(1);
  }

  // Copy into src/artifacts/, sanitizing the name the same way add-artifact does.
  const rawName = basename(src, extname(src));
  const safeName = rawName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const destPath = join(artifactsDir, `${safeName}.jsx`);
  mkdirSync(artifactsDir, { recursive: true });
  copyFileSync(srcPath, destPath);
  console.log(`Added artifact: src/artifacts/${safeName}.jsx`);

  const url = `${BASE_URL}/?artifact=${safeName}`;

  // Ensure the dev server is up: reuse if already listening, else start it.
  const alreadyUp = await probeServer(PORT);
  if (alreadyUp) {
    console.log(`Dev server already running on ${BASE_URL} (reusing it).`);
  } else {
    console.log(`Starting dev server on ${BASE_URL} ...`);
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npmCmd, ["run", "dev"], {
      cwd: repoRoot,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    const ready = await waitForServer(PORT);
    if (!ready) {
      console.warn(
        `Dev server did not respond within the timeout. It may still be ` +
          `starting; open the URL below in a moment.`,
      );
    }
  }

  // Open the default browser (best effort). Print the URL regardless.
  openUrl(url);

  console.log(`Open: ${url}`);
}

// Only run when invoked directly, not when imported by tests.
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().then(
    () => process.exit(0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
