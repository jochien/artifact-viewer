/*
  Shared cross-platform "open a URL in the default browser" helper.
  Used by both `npm run view` and `npm run add -- <file> --open`.
*/
import { spawn } from "node:child_process";

// Pure helper: map a platform to the OS command + args used to open a URL.
// Exported so it can be unit-tested without spawning anything.
export function openCommand(platform) {
  switch (platform) {
    case "darwin":
      return { command: "open", args: [] };
    case "win32":
      // `start` is a cmd builtin; the empty "" is the window-title placeholder.
      return { command: "cmd", args: ["/c", "start", ""] };
    default:
      // linux and other posix
      return { command: "xdg-open", args: [] };
  }
}

// Best-effort: open the given URL in the default browser. Never throws; the
// caller is expected to also print the URL as a fallback.
export function openUrl(url, platform = process.platform) {
  const { command, args } = openCommand(platform);
  try {
    const opener = spawn(command, [...args, url], {
      detached: true,
      stdio: "ignore",
    });
    opener.on("error", () => {
      /* auto-open failed; the printed URL is the fallback */
    });
    opener.unref();
  } catch {
    /* ignore: the printed URL is the fallback */
  }
}
