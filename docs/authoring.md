# Authoring artifacts

This viewer renders a specific shape of React file. Follow these rules and any
artifact, whether you write it by hand or generate it with an AI assistant, drops
straight into the picker and renders with zero setup.

## The rules

An artifact must follow all of these to render here:

1. **One self-contained file** in `src/artifacts/`. Everything the artifact needs
   lives in that single `.jsx` file. No helper modules, no split components across
   files.
2. **`export default` a React function component.** The default export is what the
   viewer mounts.
3. **Import only from `react`, `react-dom`, and `lucide-react`.** These are the only
   bundled dependencies. No other libraries: no Tailwind, no CSS files, no charting,
   animation, or utility packages.
4. **Inline styles only.** Style with a `style={{ ... }}` object. Do not use external
   CSS, CSS modules, or a `className` framework.
5. **No network requests and no external assets.** No `fetch`, no CDNs, no remote
   images or fonts. Generate visuals with inline SVG or CSS. Keep any sample data
   inline so the artifact is fully self-contained and interactive on first render.

## Optional: gallery card metadata

The gallery homepage shows each artifact as a card with a live preview. By default a
card is titled from the file name (`macaroni-explainer` → "Macaroni Explainer"). You
can enrich the card by adding one optional **named** export alongside the default
component — it stays in the same single file, so the artifact remains self-contained:

```jsx
export const meta = {
  title: "Macaroni",                 // optional; overrides the prettified file name
  description: "A local bridge …",   // optional; one or two lines shown on the card
  tags: ["explainer", "macOS"],      // optional; short chips shown on the card
};

export default function MacaroniExplainer() {
  // …
}
```

Every field is optional and the card degrades gracefully: no `meta` → name-only card,
no `description` → no description line, no `tags` → no chips. `meta` is loaded lazily
(only when the card scrolls into view), so it never changes the render rules above.

## Copy-paste AI prompt

Hand this to Claude, Copilot, or Cursor. Replace `<describe what you want>` with your
idea and paste the result into `src/artifacts/`.

```text
Create a single, self-contained React artifact that renders in a minimal Vite +
React 18 viewer. Follow every rule exactly:

- Output ONE self-contained .jsx file and nothing else. All logic, styles, and
  sample data live in that one file.
- The file must `export default` a single React function component.
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

Build this: <describe what you want>
```

## Start from an example

The seven artifacts already in `src/artifacts/` are working, viewer-ready references.
The fastest way to a new artifact is to copy one that resembles what you want and tweak
it, or to paste a couple into your AI chat as few-shot examples alongside the prompt
above. Good starting points:

- `pomodoro-timer.jsx` — interactive state, timers, and an inline SVG progress ring.
- `saas-pricing-page.jsx` — a static-feeling marketing page with a toggle and layout.

Both stick to the rules above, so they show exactly what renders cleanly here.

## Getting it in

Once you have the artifact file:

- Paste the AI output into a new file under `src/artifacts/`, for example
  `src/artifacts/my-artifact.jsx`, or
- Run `npm run add -- /path/to/my-artifact.jsx` to copy it in.

Either way it appears in the picker at the top of the viewer automatically, and hot
reload picks up every save.
