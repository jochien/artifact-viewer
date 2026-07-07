import React, { Suspense, useMemo, useState } from "react";
import { Plus, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { AUTHORING_PROMPT } from "./authoringPrompt.js";
import { pathToName, nameToPath, isPopout } from "./artifactNames.js";

/*
  Auto-discovers every .jsx file in ./artifacts and lets you pick one to render.
  Drop (or symlink) any React artifact into src/artifacts/ — it appears here on save.
*/
const modules = import.meta.glob("./artifacts/*.jsx");

const names = Object.keys(modules)
  .map((path) => ({ path, name: pathToName(path) }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Resolve the initial artifact path from ?artifact=<name>, falling back to the
// first discovered artifact when the param is absent or does not match one.
function initialSelected() {
  const wanted = new URLSearchParams(window.location.search).get("artifact");
  return nameToPath(names, wanted) ?? names[0]?.path ?? null;
}

export default function App() {
  const [selected, setSelected] = useState(initialSelected);
  const [showPrompt, setShowPrompt] = useState(false);

  // In popout mode the page is a bare, chrome-light window: render only the artifact.
  const popout = isPopout(window.location.search);

  // Reflect the current selection in the URL without reloading or adding history.
  const selectPath = (path) => {
    setSelected(path);
    const url = new URL(window.location.href);
    url.searchParams.set("artifact", pathToName(path));
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          borderBottom: "1px solid #e2e2e2",
          background: "#fafafa",
          flex: "0 0 auto",
        }}
      >
        <strong style={{ fontSize: 13, color: "#333" }}>Artifact Viewer</strong>
        {names.length > 0 ? (
          <select
            value={selected ?? ""}
            onChange={(e) => selectPath(e.target.value)}
            style={{ fontSize: 13, padding: "3px 6px" }}
          >
            {names.map(({ path, name }) => (
              <option key={path} value={path}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: 13, color: "#999" }}>
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
              color: showPrompt ? "#1a5fb4" : "#555",
              background: showPrompt ? "#eaf2fd" : "#fff",
              border: "1px solid #d5d5d5",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2.2} />
            New artifact
          </button>
        )}
        {names.length > 0 && (
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
              color: "#555",
              background: "#fff",
              border: "1px solid #d5d5d5",
              borderRadius: 5,
              cursor: selected ? "pointer" : "default",
            }}
          >
            <ExternalLink size={13} strokeWidth={2.2} />
            Pop out
          </button>
        )}
        {names.length > 0 && (
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
              color: selected ? "#a5432e" : "#bbb",
              background: "#fff",
              border: "1px solid #d5d5d5",
              borderRadius: 5,
              cursor: selected ? "pointer" : "default",
            }}
          >
            <Trash2 size={13} strokeWidth={2.2} />
            Delete
          </button>
        )}
      </header>

      {names.length > 0 && showPrompt && (
        <div
          style={{
            flex: "0 0 auto",
            borderBottom: "1px solid #e2e2e2",
            background: "#f7f7f7",
            padding: "12px 14px",
            maxHeight: "42vh",
            overflow: "auto",
          }}
        >
          <MakeOnePanel />
        </div>
      )}

      <main style={{ flex: "1 1 auto", overflow: "auto" }}>
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
    </div>
  );
}

function CopyPromptButton() {
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
        color: copied ? "#1a7f37" : "#333",
        background: copied ? "#e7f6ea" : "#fff",
        border: `1px solid ${copied ? "#9bd3a7" : "#d5d5d5"}`,
        borderRadius: 5,
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2} />}
      {copied ? "Copied!" : "Copy prompt"}
    </button>
  );
}

function MakeOnePanel() {
  return (
    <div style={{ color: "#444", fontSize: 13, lineHeight: 1.5 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 13, color: "#333" }}>Make one</strong>
        <CopyPromptButton />
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
          style={{ color: "#1a5fb4" }}
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
          background: "#fff",
          border: "1px solid #e2e2e2",
          borderRadius: 6,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          color: "#333",
        }}
      >
        {AUTHORING_PROMPT}
      </pre>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 24, color: "#666", fontSize: 14, lineHeight: 1.6 }}>
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
        <MakeOnePanel />
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
      return (
        <pre
          style={{
            padding: 20,
            color: "#a5432e",
            whiteSpace: "pre-wrap",
            fontSize: 13,
          }}
        >
          {String(this.state.error?.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}
