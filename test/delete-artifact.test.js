import { describe, it, expect } from "vitest";
import path from "node:path";
import { safeArtifactPath } from "../scripts/lib/delete-artifact.mjs";

const artifactsDir = "/repo/src/artifacts";
const resolvedDir = path.resolve(artifactsDir);

describe("safeArtifactPath", () => {
  it("returns the resolved .jsx path for a valid name", () => {
    const p = safeArtifactPath(artifactsDir, "my-artifact");
    expect(p).toBe(path.join(resolvedDir, "my-artifact.jsx"));
    expect(p.endsWith(`${path.sep}my-artifact.jsx`)).toBe(true);
    expect(p.startsWith(resolvedDir + path.sep)).toBe(true);
  });

  it("accepts names with digits, dashes, and underscores", () => {
    expect(safeArtifactPath(artifactsDir, "foo_bar-123")).toBe(
      path.join(resolvedDir, "foo_bar-123.jsx"),
    );
  });

  // Every one of these must be rejected (null) and never reach the filesystem.
  const rejected = [
    ["parent-relative traversal", "../package"],
    ["deep traversal to etc", "../../etc/passwd"],
    ["embedded slash", "foo/bar"],
    ["dot-dot only", ".."],
    ["empty string", ""],
    ["name with a dot", "a.b"],
    ["absolute path", "/abs"],
    ["name with a space", "name with space"],
    ["non-string (number)", 42],
    ["non-string (null)", null],
    ["non-string (undefined)", undefined],
    ["non-string (object)", {}],
  ];

  for (const [label, value] of rejected) {
    it(`rejects ${label}`, () => {
      expect(safeArtifactPath(artifactsDir, value)).toBeNull();
    });
  }

  it("never resolves outside the artifacts directory for a traversal name", () => {
    // Sanity: a raw resolve of "../package.jsx" would escape the dir; the guard
    // must return null rather than that escaped path.
    expect(safeArtifactPath(artifactsDir, "../package")).toBeNull();
  });
});
