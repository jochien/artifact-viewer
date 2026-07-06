// Pure helpers mapping between an artifact's module path (e.g. "./artifacts/foo.jsx")
// and its short name (e.g. "foo"), the string shown in the picker and used in the
// ?artifact=<name> URL contract. Kept DOM-free so it is unit-testable in Vitest.

// Derive the short name from a module path: "./artifacts/foo.jsx" -> "foo".
export function pathToName(path) {
  return path.replace("./artifacts/", "").replace(/\.jsx$/, "");
}

// Resolve a name to its module path using the discovered list of { path, name }.
// Returns null if no artifact matches.
export function nameToPath(names, name) {
  return names.find((n) => n.name === name)?.path ?? null;
}
