import { describe, it, expect } from 'vitest';
import { pathToName, nameToPath } from '../src/artifactNames.js';

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
