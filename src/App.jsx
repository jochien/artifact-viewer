import React, { Suspense, useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ChevronLeft,
  Moon,
  Sun,
  FolderPlus,
} from "lucide-react";
import { AUTHORING_PROMPT } from "./authoringPrompt.js";
import {
  pathToName,
  isPopout,
  resolveView,
  prettifyName,
  thumbScale,
  cardMeta,
  resolveTheme,
  reconcileGroups,
  moveCard,
  buildNames,
  missingDependency,
} from "./artifactNames.js";

/*
  Auto-discovers every .jsx/.tsx file in ./artifacts and lets you pick one to render.
  Drop (or symlink) any React artifact into src/artifacts/ — it appears here on save.
*/
const modules = import.meta.glob("./artifacts/*.{jsx,tsx}");

const names = buildNames(Object.keys(modules));

// Chrome theme palettes. These style the viewer shell only (header, gallery,
// panels) — artifacts always render with their own colors.
const THEMES = {
  light: {
    appBg: "#ffffff",
    headerBg: "#fafafa",
    border: "#e2e2e2",
    borderSoft: "#eeeeee",
    text: "#333333",
    textStrong: "#222222",
    muted: "#888888",
    faint: "#999999",
    cardBg: "#ffffff",
    cardHover: "#bcd2f0",
    cardShadow: "rgba(26,95,180,0.10)",
    thumbBg: "#fbfbfd",
    tileBg: "#eef4fd",
    tileInner: "#dbe9fb",
    accent: "#1a5fb4",
    accentSoftBg: "#eaf2fd",
    btnBg: "#ffffff",
    btnBorder: "#d5d5d5",
    btnText: "#555555",
    panelBg: "#f7f7f7",
    desc: "#666666",
    codeBg: "#ffffff",
    tagText: "#3a6ea5",
    tagBg: "#eef4fd",
    tagBorder: "#d6e4f7",
    danger: "#a5432e",
  },
  dark: {
    appBg: "#0d1117",
    headerBg: "#161b22",
    border: "#30363d",
    borderSoft: "#21262d",
    text: "#c9d1d9",
    textStrong: "#e6edf3",
    muted: "#8b949e",
    faint: "#6e7681",
    cardBg: "#161b22",
    cardHover: "#388bfd",
    cardShadow: "rgba(56,139,253,0.20)",
    thumbBg: "#0d1117",
    tileBg: "#1c2333",
    tileInner: "#233047",
    accent: "#58a6ff",
    accentSoftBg: "#132133",
    btnBg: "#21262d",
    btnBorder: "#30363d",
    btnText: "#c9d1d9",
    panelBg: "#161b22",
    desc: "#8b949e",
    codeBg: "#0d1117",
    tagText: "#79c0ff",
    tagBg: "#132133",
    tagBorder: "#1f3a5f",
    danger: "#f85149",
  },
};

// The initial theme: a stored choice wins, else follow the OS setting.
function initialTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem("artifact-viewer-theme");
  } catch {
    /* storage unavailable */
  }
  const systemDark =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  return resolveTheme(stored, systemDark);
}

// Persisted gallery groups (order + membership + names).
const GROUPS_KEY = "artifact-viewer-groups";
function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveGroups(groups) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    /* storage unavailable */
  }
}

// Resolve the initial artifact path from the URL. A missing or unknown
// ?artifact=<name> leaves nothing selected, which renders the gallery homepage.
function initialSelected() {
  return resolveView(window.location.search, names).path;
}

export default function App() {
  const [selected, setSelected] = useState(initialSelected);
  const [showPrompt, setShowPrompt] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const t = THEMES[theme] || THEMES.light;
  const toggleTheme = () => {
    setTheme((cur) => {
      const next = cur === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("artifact-viewer-theme", next);
      } catch {
        /* storage unavailable — session-only */
      }
      return next;
    });
  };

  // In popout mode the page is a bare, chrome-light window: render only the artifact.
  const popout = isPopout(window.location.search);

  // Reflect the current selection in the URL without reloading or adding history.
  const selectPath = (path) => {
    setSelected(path);
    const url = new URL(window.location.href);
    url.searchParams.set("artifact", pathToName(path));
    history.replaceState(null, "", url);
  };

  // Return to the gallery homepage: clear the selection and drop ?artifact.
  const goToGallery = () => {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("artifact");
    history.replaceState(null, "", url);
  };

  // Open the current artifact in a compact standalone window, preserving the
  // ?artifact=<name> contract and flagging popout mode so it renders bare.
  const openPopout = () => {
    if (!selected) return;
    const url = `?artifact=${encodeURIComponent(pathToName(selected))}&popout=1`;
    window.open(url, "_blank", "width=480,height=800");
  };

  // Delete the selected artifact via the dev-only endpoint. On success, clear
  // ?artifact and reload so import.meta.glob re-evaluates and the picker moves
  // to another artifact. The endpoint only exists in the dev server.
  const deleteSelected = async () => {
    if (!selected) return;
    const name = pathToName(selected);
    if (
      !window.confirm(
        `Delete ${name}? This removes the file from src/artifacts/.`,
      )
    )
      return;
    try {
      const res = await fetch("/__delete-artifact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        alert(`Could not delete ${name} (status ${res.status}).`);
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("artifact");
      window.location.href = url.pathname + url.search;
    } catch {
      alert(`Could not delete ${name}.`);
    }
  };

  const Artifact = useMemo(() => {
    if (!selected) return null;
    return React.lazy(async () => {
      const mod = await modules[selected]();
      return { default: mod.default ?? Object.values(mod)[0] };
    });
  }, [selected]);

  if (popout) {
    return (
      <main style={{ height: "100%", overflow: "auto" }}>
        {Artifact ? (
          <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
            <ErrorBoundary key={selected}>
              <Artifact />
            </ErrorBoundary>
          </Suspense>
        ) : (
          <EmptyState />
        )}
      </main>
    );
  }

  const inGallery = !selected;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: t.appBg,
        color: t.text,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          borderBottom: `1px solid ${t.border}`,
          background: t.headerBg,
          flex: "0 0 auto",
        }}
      >
        <button
          type="button"
          onClick={goToGallery}
          title={inGallery ? "Artifact gallery" : "Back to the gallery"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: t.textStrong,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {!inGallery && <ChevronLeft size={15} strokeWidth={2.2} />}
          Artifact Viewer
        </button>
        {!inGallery && names.length > 0 && (
          <select
            value={selected ?? ""}
            onChange={(e) => selectPath(e.target.value)}
            style={{
              fontSize: 13,
              padding: "3px 6px",
              background: t.btnBg,
              color: t.text,
              border: `1px solid ${t.btnBorder}`,
              borderRadius: 5,
            }}
          >
            {names.map(({ path, name }) => (
              <option key={path} value={path}>
                {prettifyName(name)}
              </option>
            ))}
          </select>
        )}
        {inGallery && names.length === 0 && (
          <span style={{ fontSize: 13, color: t.faint }}>
            No artifacts yet — add a .jsx file to src/artifacts/
          </span>
        )}
        {names.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            aria-expanded={showPrompt}
            title="Show the prompt for creating a new artifact"
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              padding: "3px 8px",
              color: showPrompt ? t.accent : t.btnText,
              background: showPrompt ? t.accentSoftBg : t.btnBg,
              border: `1px solid ${t.btnBorder}`,
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2.2} />
            New artifact
          </button>
        )}
        {selected && (
          <button
            type="button"
            onClick={openPopout}
            disabled={!selected}
            title="Open this artifact in a separate compact window"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              padding: "3px 8px",
              color: t.btnText,
              background: t.btnBg,
              border: `1px solid ${t.btnBorder}`,
              borderRadius: 5,
              cursor: selected ? "pointer" : "default",
            }}
          >
            <ExternalLink size={13} strokeWidth={2.2} />
            Pop out
          </button>
        )}
        {selected && (
          <button
            type="button"
            onClick={deleteSelected}
            disabled={!selected}
            title="Delete this artifact file from src/artifacts/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              padding: "3px 8px",
              color: selected ? t.danger : t.faint,
              background: t.btnBg,
              border: `1px solid ${t.btnBorder}`,
              borderRadius: 5,
              cursor: selected ? "pointer" : "default",
            }}
          >
            <Trash2 size={13} strokeWidth={2.2} />
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle color theme"
          style={{
            marginLeft: names.length > 0 ? 0 : "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            padding: "4px 8px",
            color: t.btnText,
            background: t.btnBg,
            border: `1px solid ${t.btnBorder}`,
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? (
            <Sun size={14} strokeWidth={2.2} />
          ) : (
            <Moon size={14} strokeWidth={2.2} />
          )}
        </button>
      </header>

      {names.length > 0 && showPrompt && (
        <div
          style={{
            flex: "0 0 auto",
            borderBottom: `1px solid ${t.border}`,
            background: t.panelBg,
            padding: "12px 14px",
            maxHeight: "42vh",
            overflow: "auto",
          }}
        >
          <MakeOnePanel t={t} />
        </div>
      )}

      <main style={{ flex: "1 1 auto", overflow: "auto" }}>
        {inGallery ? (
          names.length > 0 ? (
            <Gallery names={names} onOpen={selectPath} t={t} />
          ) : (
            <EmptyState t={t} />
          )
        ) : (
          <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
            <ErrorBoundary key={selected}>
              <Artifact />
            </ErrorBoundary>
          </Suspense>
        )}
      </main>
    </div>
  );
}

// Logical width the artifact is rendered at before being scaled down into a card,
// and the fixed height of the thumbnail crop.
const THUMB_STAGE_W = 1200;
const THUMB_H = 148;

// Mount a card's preview only once it scrolls near the viewport, so a large
// gallery stays responsive. Falls back to "always in view" without IO support.
function useInView(ref, rootMargin = "300px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, inView, rootMargin]);
  return inView;
}

// Isolate a single artifact's render failure so one broken artifact shows its
// fallback tile instead of taking down the whole gallery.
class ThumbErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

// A live, non-interactive preview of an artifact: rendered at THUMB_STAGE_W and
// scaled to the card width, cropped to THUMB_H. Lazily loaded when in view.
function Thumbnail({ path, inView, fallback, t = THEMES.light }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[entries.length - 1].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const Comp = useMemo(() => {
    if (!inView || !modules[path]) return null;
    return React.lazy(async () => {
      const mod = await modules[path]();
      return { default: mod.default ?? Object.values(mod)[0] };
    });
  }, [inView, path]);

  const scale = thumbScale(width, THUMB_STAGE_W);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      style={{
        position: "relative",
        height: THUMB_H,
        overflow: "hidden",
        background: t.thumbBg,
        borderBottom: `1px solid ${t.borderSoft}`,
      }}
    >
      {Comp && scale > 0 ? (
        <ThumbErrorBoundary fallback={fallback}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: THUMB_STAGE_W,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          >
            <Suspense fallback={null}>
              <Comp />
            </Suspense>
          </div>
        </ThumbErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}

function GalleryCard({ path, name, onOpen, t = THEMES.light }) {
  const cardRef = useRef(null);
  const inView = useInView(cardRef);
  const [meta, setMeta] = useState(null);
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  // Load the artifact's optional `meta` export lazily, sharing the card's
  // in-view trigger so we never eagerly import every artifact up front.
  useEffect(() => {
    if (!inView || !modules[path]) return;
    let alive = true;
    modules[path]()
      .then((m) => {
        if (alive) setMeta(m?.meta ?? {});
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [inView, path]);

  const { title, description, tags } = cardMeta(meta, name);

  const tile = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: t.tileBg,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          background: t.tileInner,
          color: t.accent,
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {title.charAt(0)}
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(path);
        }
      }}
      title={`Open ${title}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 120ms, box-shadow 120ms, transform 120ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = t.cardHover;
        e.currentTarget.style.boxShadow = `0 2px 10px ${t.cardShadow}`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <Thumbnail path={path} inView={inView} fallback={tile} t={t} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 13.5, fontWeight: 600, color: t.textStrong }}>
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              color: t.desc,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        )}
        <div style={{ fontFamily: mono, fontSize: 10.5, color: t.faint }}>
          {name}.jsx
        </div>
        {tags.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  color: t.tagText,
                  background: t.tagBg,
                  border: `1px solid ${t.tagBorder}`,
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Gallery({ names, onOpen, t = THEMES.light }) {
  const byName = useMemo(() => {
    const m = {};
    names.forEach((n) => {
      m[n.name] = n;
    });
    return m;
  }, [names]);

  const [groups, setGroups] = useState(() =>
    reconcileGroups(names, loadGroups()),
  );
  const [dragName, setDragName] = useState(null);
  const [dropHint, setDropHint] = useState(null); // { groupId, index } (card) or { groupId } (section)
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const moveTo = (name, toGroupId, toIndex) => {
    if (!name) return;
    setGroups((g) => moveCard(g, name, toGroupId, toIndex));
    setDragName(null);
    setDropHint(null);
  };

  const addGroup = () => {
    const id = "g" + Math.random().toString(36).slice(2, 8);
    setGroups((g) => [...g, { id, name: "New group", items: [] }]);
    setEditingId(id);
    setEditingValue("New group");
  };
  const commitRename = () => {
    const name = editingValue.trim() || "Group";
    setGroups((g) => g.map((x) => (x.id === editingId ? { ...x, name } : x)));
    setEditingId(null);
    setEditingValue("");
  };
  const deleteGroup = (id) => {
    setGroups((g) => {
      if (g.length <= 1) return g;
      const victim = g.find((x) => x.id === id);
      const rest = g.filter((x) => x.id !== id);
      rest[0] = {
        ...rest[0],
        items: [...rest[0].items, ...((victim && victim.items) || [])],
      };
      return rest;
    });
  };

  const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 10px",
    color: t.btnText,
    background: t.btnBg,
    border: `1px solid ${t.btnBorder}`,
    borderRadius: 6,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "20px clamp(14px, 3vw, 28px) 40px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18, color: t.textStrong }}>Artifacts</h1>
        <span style={{ fontSize: 13, color: t.muted }}>
          {names.length} {names.length === 1 ? "artifact" : "artifacts"}
        </span>
        <button type="button" onClick={addGroup} style={{ ...btnStyle, marginLeft: "auto" }}>
          <FolderPlus size={14} strokeWidth={2.2} /> New group
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: t.muted, marginBottom: 16 }}>
        Drag a card to reorder it or move it between groups. Click a group name to rename it.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {groups.map((grp) => {
          const overSection = dropHint && dropHint.groupId === grp.id;
          return (
            <section
              key={grp.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDropHint({ groupId: grp.id });
              }}
              onDrop={(e) => {
                e.preventDefault();
                const nm = e.dataTransfer.getData("text/plain") || dragName;
                moveTo(nm, grp.id, grp.items.length);
              }}
              style={{
                border: `1px solid ${overSection ? t.accent : t.border}`,
                borderRadius: 12,
                padding: "12px 14px 14px",
                background: t.headerBg,
                transition: "border-color 120ms",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {editingId === grp.id ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingValue("");
                      }
                    }}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      padding: "2px 6px",
                      color: t.textStrong,
                      background: t.cardBg,
                      border: `1px solid ${t.accent}`,
                      borderRadius: 5,
                      outline: "none",
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(grp.id);
                      setEditingValue(grp.name);
                    }}
                    title="Rename group"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: t.textStrong,
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "text",
                    }}
                  >
                    {grp.name}
                  </button>
                )}
                <span style={{ fontSize: 12, color: t.muted }}>
                  {grp.items.length}
                </span>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteGroup(grp.id)}
                    title="Delete group (its cards move to the first group)"
                    style={{
                      marginLeft: "auto",
                      display: "inline-flex",
                      alignItems: "center",
                      padding: 4,
                      color: t.muted,
                      background: "transparent",
                      border: "none",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {grp.items.length === 0 ? (
                <div
                  style={{
                    padding: "18px 12px",
                    textAlign: "center",
                    fontSize: 12,
                    color: t.faint,
                    border: `1px dashed ${t.border}`,
                    borderRadius: 10,
                  }}
                >
                  Drag cards here
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: 14,
                  }}
                >
                  {grp.items.map((nm, idx) => {
                    const entry = byName[nm];
                    if (!entry) return null;
                    const isDragging = dragName === nm;
                    const isCardTarget =
                      dropHint &&
                      dropHint.groupId === grp.id &&
                      dropHint.index === idx;
                    return (
                      <div
                        key={nm}
                        draggable
                        onDragStart={(e) => {
                          setDragName(nm);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", nm);
                        }}
                        onDragEnd={() => {
                          setDragName(null);
                          setDropHint(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDropHint({ groupId: grp.id, index: idx });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const dropped =
                            e.dataTransfer.getData("text/plain") || dragName;
                          moveTo(dropped, grp.id, idx);
                        }}
                        style={{
                          opacity: isDragging ? 0.4 : 1,
                          borderRadius: 12,
                          outline: isCardTarget
                            ? `2px solid ${t.accent}`
                            : "2px solid transparent",
                          outlineOffset: 2,
                          transition: "opacity 120ms, outline-color 120ms",
                        }}
                      >
                        <GalleryCard
                          path={entry.path}
                          name={nm}
                          onOpen={onOpen}
                          t={t}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CopyPromptButton({ t = THEMES.light }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(AUTHORING_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context); leave button state as-is.
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        padding: "5px 10px",
        color: copied ? "#1a7f37" : t.btnText,
        background: copied ? "#e7f6ea" : t.btnBg,
        border: `1px solid ${copied ? "#9bd3a7" : t.btnBorder}`,
        borderRadius: 5,
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2} />}
      {copied ? "Copied!" : "Copy prompt"}
    </button>
  );
}

function MakeOnePanel({ t = THEMES.light }) {
  return (
    <div style={{ color: t.text, fontSize: 13, lineHeight: 1.5 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 13, color: t.textStrong }}>Make one</strong>
        <CopyPromptButton t={t} />
      </div>
      <p style={{ margin: "0 0 8px" }}>
        Paste this into Claude, Copilot, or Cursor, replace{" "}
        <code>&lt;describe what you want&gt;</code>, and drop the result into{" "}
        <code>src/artifacts/</code>. You can also copy an existing example to start
        from. See{" "}
        <a
          href="https://github.com/jochien/artifact-viewer/blob/main/docs/authoring.md"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: t.accent }}
        >
          the authoring guide
        </a>{" "}
        for the full rules.
      </p>
      <pre
        style={{
          margin: 0,
          padding: 12,
          maxHeight: 260,
          overflow: "auto",
          background: t.codeBg,
          border: `1px solid ${t.border}`,
          borderRadius: 6,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          color: t.text,
        }}
      >
        {AUTHORING_PROMPT}
      </pre>
    </div>
  );
}

function EmptyState({ t = THEMES.light }) {
  return (
    <div style={{ padding: 24, color: t.desc, fontSize: 14, lineHeight: 1.6 }}>
      <p style={{ marginTop: 0 }}>
        Drop a React artifact into <code>src/artifacts/</code> and it shows up in
        the picker above.
      </p>
      <p>
        Quick add from the terminal:
        <br />
        <code>npm run add -- /path/to/your-file.jsx</code>
      </p>
      <div style={{ maxWidth: 720, marginTop: 18 }}>
        <MakeOnePanel t={t} />
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      const dep = missingDependency(err?.stack || err?.message || err);
      if (dep) {
        const mono =
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
        return (
          <div style={{ padding: 24, maxWidth: 640, lineHeight: 1.55 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#d29922",
                marginBottom: 8,
              }}
            >
              Missing dependency: {dep}
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13.5 }}>
              This artifact imports <code style={{ fontFamily: mono }}>{dep}</code>,
              which is not installed. Install it and reload:
            </p>
            <pre
              style={{
                margin: 0,
                padding: "10px 12px",
                background: "rgba(127,127,127,0.14)",
                borderRadius: 8,
                fontFamily: mono,
                fontSize: 13,
                whiteSpace: "pre-wrap",
              }}
            >
              npm install {dep}
            </pre>
            <p style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
              Tip: viewer-ready artifacts should import only{" "}
              <code style={{ fontFamily: mono }}>react</code>,{" "}
              <code style={{ fontFamily: mono }}>react-dom</code>, and{" "}
              <code style={{ fontFamily: mono }}>lucide-react</code>. Run{" "}
              <code style={{ fontFamily: mono }}>npm run scan-deps</code> to list
              every missing import across artifacts.
            </p>
          </div>
        );
      }
      return (
        <pre
          style={{
            padding: 20,
            color: "#a5432e",
            whiteSpace: "pre-wrap",
            fontSize: 13,
          }}
        >
          {String(err?.stack || err)}
        </pre>
      );
    }
    return this.props.children;
  }
}
