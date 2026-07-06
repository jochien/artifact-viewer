import { describe, it, expect } from 'vitest';
import { isPopout } from '../src/artifactNames.js';

describe('isPopout', () => {
  it('is true when popout=1 is present', () => {
    expect(isPopout('?popout=1')).toBe(true);
    expect(isPopout('?artifact=invoice-builder&popout=1')).toBe(true);
  });

  it('is false when popout is absent', () => {
    expect(isPopout('')).toBe(false);
    expect(isPopout('?artifact=invoice-builder')).toBe(false);
  });

  it('is false for other popout values', () => {
    expect(isPopout('?popout=0')).toBe(false);
    expect(isPopout('?popout=true')).toBe(false);
  });
});
