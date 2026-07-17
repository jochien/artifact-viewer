import { describe, it, expect } from 'vitest';
import {
  resolveView,
  prettifyName,
  thumbScale,
  cardMeta,
  resolveTheme,
} from '../src/artifactNames.js';

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

describe('cardMeta', () => {
  it('defaults to the prettified name and empty description/tags when meta is absent', () => {
    expect(cardMeta(null, 'macaroni-explainer')).toEqual({
      title: 'Macaroni Explainer',
      description: '',
      tags: [],
    });
    expect(cardMeta(undefined, 'saas-pricing-page')).toEqual({
      title: 'Saas Pricing Page',
      description: '',
      tags: [],
    });
  });

  it('uses provided title, description, and tags when present', () => {
    expect(
      cardMeta(
        { title: 'Macaroni', description: 'A local bridge.', tags: ['macOS', 'MCP'] },
        'macaroni-explainer',
      ),
    ).toEqual({
      title: 'Macaroni',
      description: 'A local bridge.',
      tags: ['macOS', 'MCP'],
    });
  });

  it('trims strings and falls back to the name for a blank title', () => {
    expect(cardMeta({ title: '   ', description: '  hi  ' }, 'trivia-quiz')).toEqual({
      title: 'Trivia Quiz',
      description: 'hi',
      tags: [],
    });
  });

  it('ignores non-string tags and drops blanks', () => {
    expect(cardMeta({ tags: ['ui', '', '  x  ', 3, null] }, 'invoice-builder').tags).toEqual([
      'ui',
      'x',
    ]);
  });

  it('is defensive against a non-object meta', () => {
    expect(cardMeta('nope', 'pomodoro-timer')).toEqual({
      title: 'Pomodoro Timer',
      description: '',
      tags: [],
    });
  });
});

describe('resolveTheme', () => {
  it('honors a stored preference over the system setting', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('falls back to the system preference when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme(undefined, true)).toBe('dark');
  });

  it('ignores invalid stored values and uses the system preference', () => {
    expect(resolveTheme('purple', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});
