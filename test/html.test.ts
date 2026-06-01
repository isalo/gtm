import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/output/html/htmlReport';

describe('escapeHtml', () => {
  it('escapes all HTML-sensitive characters', () => {
    expect(escapeHtml(`<a href="x" onmouseover='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onmouseover=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('escapes ampersands before other entities (no double-escaping)', () => {
    expect(escapeHtml('a & b < c')).toBe('a &amp; b &lt; c');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('plain text 123')).toBe('plain text 123');
  });
});
