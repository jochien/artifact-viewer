import { describe, it, expect } from 'vitest';
import { resolveView, prettifyName, thumbScale } from '../src/artifactNames.js';

const names = [
  { path: './artifacts/macaroni-explainer.jsx', name: 'macaroni-explainer' },
  { path: './artifacts/saas-pricing-page.jsx', name: 'saas-pricing-page' },
];

describe('prettifyName', () => {
  it('title-cases and splits on hyphens', () => {
    expect(prettifyName('macaroni-explainer')).toBe('Macaroni Explainer');
  });

  it('splits on underscores too', () => {
    expect(prettifyName('saas_pricing_page')).toBe('Saas Pricing Page');
  });

  it('handles a single word', () => {
    expect(prettifyName('pomodoro')).toBe('Pomodoro');
  });

  it('collapses repeated separators', () => {
    expect(prettifyName('a--b__c')).toBe('A B C');
  });

  it('is empty for nullish input', () => {
    expect(prettifyName(null)).toBe('');
    expect(prettifyName(undefined)).toBe('');
  });
});

describe('resolveView', () => {
  it('returns the gallery when there is no artifact param', () => {
    expect(resolveView('', names)).toEqual({ mode: 'gallery', path: null });
  });

  it('returns the gallery for an unknown artifact name', () => {
    expect(resolveView('?artifact=nope', names)).toEqual({
      mode: 'gallery',
      path: null,
    });
  });

  it('returns the artifact view for a known name', () => {
    expect(resolveView('?artifact=macaroni-explainer', names)).toEqual({
      mode: 'artifact',
      path: './artifacts/macaroni-explainer.jsx',
    });
  });

  it('popout mode wins and resolves the requested artifact path', () => {
    expect(resolveView('?popout=1&artifact=macaroni-explainer', names)).toEqual({
      mode: 'popout',
      path: './artifacts/macaroni-explainer.jsx',
    });
  });

  it('popout with no/unknown artifact still returns popout with a null path', () => {
    expect(resolveView('?popout=1', names)).toEqual({
      mode: 'popout',
      path: null,
    });
  });
});

describe('thumbScale', () => {
  it('is the width-to-stage ratio when both are positive', () => {
    expect(thumbScale(240, 1200)).toBe(0.2);
    expect(thumbScale(600, 1200)).toBe(0.5);
  });

  it('is 0 until a real width is known', () => {
    expect(thumbScale(0, 1200)).toBe(0);
    expect(thumbScale(undefined, 1200)).toBe(0);
  });

  it('is 0 for a non-positive stage width (never divides by a bad stage)', () => {
    expect(thumbScale(240, 0)).toBe(0);
    expect(thumbScale(240, -1200)).toBe(0);
  });
});
