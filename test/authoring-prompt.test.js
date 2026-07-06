import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { AUTHORING_PROMPT } from '../src/authoringPrompt.js';

const here = dirname(fileURLToPath(import.meta.url));
const docsPath = join(here, '..', 'docs', 'authoring.md');

// Extract the copy-paste prompt fenced code block from docs/authoring.md.
// Robust to line-number changes: find the fenced block whose contents start
// with the known first line of the prompt, rather than relying on position.
function extractPromptBlock(markdown) {
  const fenceRe = /```[^\n]*\n([\s\S]*?)```/g;
  let match;
  while ((match = fenceRe.exec(markdown)) !== null) {
    const body = match[1];
    if (body.includes('Create a single, self-contained React artifact')) {
      return body.replace(/\n$/, '');
    }
  }
  return null;
}

// Normalize only trailing whitespace on each line and a trailing newline, so
// cosmetic differences do not fail, but any real text difference does.
function normalize(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

describe('authoring prompt stays in sync with docs/authoring.md', () => {
  const markdown = readFileSync(docsPath, 'utf8');
  const block = extractPromptBlock(markdown);

  it('extracts a non-empty prompt block containing the placeholder', () => {
    expect(block).toBeTruthy();
    expect(block).toContain('<describe what you want>');
  });

  it('matches the exported AUTHORING_PROMPT', () => {
    expect(normalize(block)).toBe(normalize(AUTHORING_PROMPT));
  });
});
