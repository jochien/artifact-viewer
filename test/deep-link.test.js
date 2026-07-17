import { describe, it, expect } from 'vitest';
import { pathToName, nameToPath, buildNames } from '../src/artifactNames.js';

const names = [
  { path: './artifacts/invoice-builder.jsx', name: 'invoice-builder' },
  { path: './artifacts/pomodoro-timer.jsx', name: 'pomodoro-timer' },
  { path: './artifacts/protection-plan-comparator.jsx', name: 'protection-plan-comparator' },
];

describe('pathToName', () => {
  it('strips the ./artifacts/ prefix and .jsx suffix', () => {
    expect(pathToName('./artifacts/protection-plan-comparator.jsx')).toBe(
      'protection-plan-comparator',
    );
  });

  it('strips the .tsx suffix too', () => {
    expect(pathToName('./artifacts/hello-typescript.tsx')).toBe(
      'hello-typescript',
    );
  });
});

describe('buildNames', () => {
  it('maps and sorts .jsx and .tsx paths by name', () => {
    expect(
      buildNames([
        './artifacts/pomodoro-timer.jsx',
        './artifacts/hello.tsx',
      ]),
    ).toEqual([
      { path: './artifacts/hello.tsx', name: 'hello' },
      { path: './artifacts/pomodoro-timer.jsx', name: 'pomodoro-timer' },
    ]);
  });

  it('disambiguates a base-name collision with the full filename', () => {
    const out = buildNames([
      './artifacts/widget.jsx',
      './artifacts/widget.tsx',
    ]);
    expect(out.map((n) => n.name).sort()).toEqual(['widget.jsx', 'widget.tsx']);
    // both remain resolvable and distinct
    expect(new Set(out.map((n) => n.name)).size).toBe(2);
  });
});

describe('nameToPath', () => {
  it('resolves a known name to its module path', () => {
    expect(nameToPath(names, 'pomodoro-timer')).toBe('./artifacts/pomodoro-timer.jsx');
  });

  it('returns null for an unknown name', () => {
    expect(nameToPath(names, 'does-not-exist')).toBeNull();
  });

  it('returns null when the name is absent (null)', () => {
    expect(nameToPath(names, null)).toBeNull();
  });

  it('round-trips path -> name -> path', () => {
    const path = './artifacts/invoice-builder.jsx';
    expect(nameToPath(names, pathToName(path))).toBe(path);
  });
});
