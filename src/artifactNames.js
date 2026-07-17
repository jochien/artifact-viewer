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

// True when a location's query string requests popout mode (?popout=1), i.e. the
// bare, chrome-light render used by the pop-out window. Pure string logic, no DOM.
export function isPopout(search) {
  return new URLSearchParams(search).get("popout") === "1";
}

// Turn a short artifact name into a human-readable title: split on "-" and "_"
// and Title-Case each word. "macaroni-explainer" -> "Macaroni Explainer".
export function prettifyName(name) {
  return String(name ?? "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Decide which view the app should render from the URL query string, plus the
// artifact path (if any). Pure logic so it is unit-testable without a DOM.
//   - popout mode (?popout=1) always wins, resolving the requested artifact if
//     it exists (else path is null and the bare view shows its empty state).
//   - a ?artifact=<name> that matches a discovered artifact -> "artifact" view.
//   - anything else (no param, empty, or unknown name) -> "gallery" view.
// Returns { mode: "popout" | "artifact" | "gallery", path: string | null }.
export function resolveView(search, names) {
  const wanted = new URLSearchParams(search).get("artifact");
  const path = nameToPath(names, wanted);
  if (isPopout(search)) return { mode: "popout", path };
  if (path) return { mode: "artifact", path };
  return { mode: "gallery", path: null };
}

// Scale factor that fits a stage of logical width stageW into a box of the given
// pixel width, for the gallery's live thumbnails. Returns 0 until a real width is
// known so nothing renders (and never divides by a bad stage width). Pure math.
export function thumbScale(width, stageW) {
  if (!(width > 0) || !(stageW > 0)) return 0;
  return width / stageW;
}

// Normalize an artifact's optional `meta` export into the fields a gallery card
// renders. Everything is optional and degrades gracefully: title defaults to the
// prettified file name, description to "", tags to []. Pure logic, no DOM.
export function cardMeta(meta, name) {
  const m = meta && typeof meta === "object" ? meta : {};
  const title =
    typeof m.title === "string" && m.title.trim()
      ? m.title.trim()
      : prettifyName(name);
  const description =
    typeof m.description === "string" ? m.description.trim() : "";
  const tags = Array.isArray(m.tags)
    ? m.tags
        .filter((t) => typeof t === "string" && t.trim())
        .map((t) => t.trim())
    : [];
  return { title, description, tags };
}

// Resolve the active chrome theme from a stored preference and the OS setting.
// A stored "light"/"dark" wins; otherwise fall back to the system preference.
// Pure logic so it is unit-testable without a DOM.
export function resolveTheme(stored, systemPrefersDark) {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersDark ? "dark" : "light";
}
