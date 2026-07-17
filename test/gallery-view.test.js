import { describe, it, expect } from 'vitest';
import {
  resolveView,
  prettifyName,
  thumbScale,
  cardMeta,
  resolveTheme,
  reconcileGroups,
  moveCard,
  missingDependency,
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

describe('reconcileGroups', () => {
  const names = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];

  it('defaults to a single Ungrouped group with all names when nothing saved', () => {
    expect(reconcileGroups(names, null)).toEqual([
      { id: 'ungrouped', name: 'Ungrouped', items: ['a', 'b', 'c'] },
    ]);
  });

  it('keeps saved groups and order, and appends new names to Ungrouped', () => {
    const saved = [
      { id: 'g0', name: 'Faves', items: ['b'] },
      { id: 'g1', name: 'Ungrouped', items: ['a'] },
    ];
    const out = reconcileGroups(names, saved);
    expect(out[0]).toEqual({ id: 'g0', name: 'Faves', items: ['b'] });
    // 'c' is new -> appended to the Ungrouped group
    expect(out[1]).toEqual({ id: 'g1', name: 'Ungrouped', items: ['a', 'c'] });
  });

  it('drops artifacts that no longer exist and dedupes across groups', () => {
    const saved = [
      { id: 'g0', name: 'One', items: ['a', 'gone', 'b'] },
      { id: 'g1', name: 'Two', items: ['b', 'c'] },
    ];
    const out = reconcileGroups(names, saved);
    expect(out[0].items).toEqual(['a', 'b']); // 'gone' removed
    expect(out[1].items).toEqual(['c']); // 'b' deduped (kept in first group)
  });

  it('appends new names to the last group when there is no Ungrouped', () => {
    const saved = [{ id: 'g0', name: 'Only', items: ['a'] }];
    const out = reconcileGroups(names, saved);
    expect(out[0].items).toEqual(['a', 'b', 'c']);
  });
});

describe('moveCard', () => {
  const groups = [
    { id: 'g0', name: 'One', items: ['a', 'b'] },
    { id: 'g1', name: 'Two', items: ['c'] },
  ];

  it('moves a card to another group at an index', () => {
    const out = moveCard(groups, 'a', 'g1', 0);
    expect(out[0].items).toEqual(['b']);
    expect(out[1].items).toEqual(['a', 'c']);
  });

  it('appends when the index is past the end', () => {
    const out = moveCard(groups, 'a', 'g1', 99);
    expect(out[1].items).toEqual(['c', 'a']);
  });

  it('keeps the card exactly once (never duplicates)', () => {
    const out = moveCard(groups, 'b', 'g1', 1);
    const all = out.flatMap((g) => g.items);
    expect(all.filter((x) => x === 'b')).toHaveLength(1);
  });

  it('is immutable — does not mutate the input', () => {
    const snapshot = JSON.parse(JSON.stringify(groups));
    moveCard(groups, 'a', 'g1', 0);
    expect(groups).toEqual(snapshot);
  });
});

describe('missingDependency', () => {
  it('extracts the package from a Vite resolve error', () => {
    expect(
      missingDependency(
        `Failed to resolve import "recharts" from "src/artifacts/x.jsx". Does the file exist?`,
      ),
    ).toBe('recharts');
  });

  it('keeps the @scope and strips any subpath', () => {
    expect(
      missingDependency(`Failed to resolve import "@tanstack/react-query/foo"`),
    ).toBe('@tanstack/react-query');
    expect(missingDependency(`Cannot find module "lodash/debounce"`)).toBe(
      'lodash',
    );
  });

  it('returns null for relative imports and unrelated errors', () => {
    expect(missingDependency(`Failed to resolve import "./helper"`)).toBeNull();
    expect(missingDependency('TypeError: x is not a function')).toBeNull();
    expect(missingDependency(null)).toBeNull();
    expect(missingDependency(undefined)).toBeNull();
  });
});
