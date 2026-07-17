import { describe, it, expect } from 'vitest';
import { SCENARIOS } from '../src/artifacts/github-workflow-explainer.jsx';

// The scenario data is the behavior of this artifact, so it is worth testing
// even though the rendering itself is not (node env, no jsdom).
describe('github workflow explainer scenarios', () => {
  it('defines six scenarios with unique ids', () => {
    expect(SCENARIOS).toHaveLength(6);
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers the intended situations', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(ids).toEqual([
      'happy',
      'behind',
      'conflict',
      'stacked',
      'ci-fail',
      'revert',
    ]);
  });

  it('every scenario has a label, tagline, and non-empty steps', () => {
    for (const s of SCENARIOS) {
      expect(typeof s.label).toBe('string');
      expect(s.label.length).toBeGreaterThan(0);
      expect(typeof s.tagline).toBe('string');
      expect(s.tagline.length).toBeGreaterThan(0);
      expect(Array.isArray(s.steps)).toBe(true);
      expect(s.steps.length).toBeGreaterThan(0);
    }
  });

  it('every step has a title and body', () => {
    for (const s of SCENARIOS) {
      for (const st of s.steps) {
        expect(typeof st.title).toBe('string');
        expect(st.title.length).toBeGreaterThan(0);
        expect(typeof st.body).toBe('string');
        expect(st.body.length).toBeGreaterThan(0);
      }
    }
  });
});
