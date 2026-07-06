// The copy-paste AI prompt for authoring a new artifact.
// SOURCE OF TRUTH: docs/authoring.md ("Copy-paste AI prompt" section).
// Keep this string in sync with the fenced block in that guide.
export const AUTHORING_PROMPT = `Create a single, self-contained React artifact that renders in a minimal Vite +
React 18 viewer. Follow every rule exactly:

- Output ONE self-contained .jsx file and nothing else. All logic, styles, and
  sample data live in that one file.
- The file must \`export default\` a single React function component.
- Import ONLY from "react", "react-dom", and "lucide-react". Do not import or rely
  on any other library: no Tailwind, no CSS files or CSS modules, no charting,
  animation, routing, state, or utility packages. You MAY use lucide-react for
  icons.
- Style with inline style objects only (style={{ ... }}). Do not use className,
  external CSS, or any styling framework.
- Make no network requests (no fetch, no APIs) and use no external assets (no
  remote images, fonts, or CDNs). Create all visuals with inline SVG or CSS.
- Include any needed sample data inline. The component must be fully self-contained
  and interactive without any additional setup.
- Use React hooks (useState, useEffect, etc.) directly from the "react" import.

Output ONLY the code for that one .jsx file, with no explanation, no markdown
fences, and no surrounding prose.

Build this: <describe what you want>`;
