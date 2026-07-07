/*
  Path-traversal guard for the dev-only delete-artifact endpoint.
  Kept as a pure, side-effect-free helper so it can be unit-tested without
  touching the filesystem or spinning up a server.
*/
import path from "node:path";

// Only bare picker names are valid: letters, digits, dash, underscore. No dots
// (so no ".jsx", no ".."), no slashes, no path separators of any kind.
const VALID_NAME = /^[a-zA-Z0-9-_]+$/;

// Resolve a picker name to the absolute path of its artifact file, but ONLY if
// that path stays strictly inside `artifactsDir`. Returns null for anything
// unsafe (bad type, bad characters, or a path that escapes the directory), so
// the caller can reject without ever touching the filesystem.
export function safeArtifactPath(artifactsDir, name) {
  if (typeof name !== "string" || !VALID_NAME.test(name)) return null;

  const dir = path.resolve(artifactsDir);
  const p = path.resolve(dir, name + ".jsx");

  // Belt-and-suspenders: even though the regex forbids separators and dots,
  // confirm the resolved path is a direct child of the artifacts directory.
  if (!p.startsWith(dir + path.sep)) return null;

  return p;
}
