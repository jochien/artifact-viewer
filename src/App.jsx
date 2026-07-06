import React, { Suspense, useMemo, useState } from "react";

/*
  Auto-discovers every .jsx file in ./artifacts and lets you pick one to render.
  Drop (or symlink) any React artifact into src/artifacts/ — it appears here on save.
*/
const modules = import.meta.glob("./artifacts/*.jsx");

const names = Object.keys(modules)
  .map((path) => ({
    path,
    name: path.replace("./artifacts/", "").replace(/\.jsx$/, ""),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function App() {
  const [selected, setSelected] = useState(names[0]?.path ?? null);

  const Artifact = useMemo(() => {
    if (!selected) return null;
    return React.lazy(async () => {
      const mod = await modules[selected]();
      return { default: mod.default ?? Object.values(mod)[0] };
    });
  }, [selected]);

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
            onChange={(e) => setSelected(e.target.value)}
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
      </header>

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

function EmptyState() {
  return (
    <div style={{ padding: 24, color: "#666", fontSize: 14, lineHeight: 1.6 }}>
      <p>Drop a React artifact into <code>src/artifacts/</code> and it shows up in the picker above.</p>
      <p>
        Quick add from the terminal:
        <br />
        <code>npm run add -- /path/to/your-file.jsx</code>
      </p>
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
