import { describe, it, expect } from 'vitest';
import { openCommand } from '../scripts/view-artifact.mjs';

describe('openCommand', () => {
  it('uses `open` on macOS (darwin)', () => {
    expect(openCommand('darwin')).toEqual({ command: 'open', args: [] });
  });

  it('uses `cmd /c start` on Windows (win32)', () => {
    expect(openCommand('win32')).toEqual({ command: 'cmd', args: ['/c', 'start', ''] });
  });

  it('uses `xdg-open` on Linux', () => {
    expect(openCommand('linux')).toEqual({ command: 'xdg-open', args: [] });
  });

  it('falls back to `xdg-open` for unknown platforms', () => {
    expect(openCommand('freebsd')).toEqual({ command: 'xdg-open', args: [] });
  });
});
