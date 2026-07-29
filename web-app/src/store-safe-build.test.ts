import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('prodavnički build bez izvornih priča', () => {
  it('workflow obavezno uključuje dečje-bezbedni režim', () => {
    const workflow = readFileSync(
      resolve(process.cwd(), '.github', 'workflows', 'store-aab.yml'),
      'utf8'
    );

    expect(workflow).toContain('VITE_STORE_SAFE_CONTENT: "true"');
  });

  it('nakon store builda ne ostavlja izvorne tekstove ni snimke', () => {
    if (process.env.VITE_STORE_SAFE_CONTENT !== 'true') return;

    expect(existsSync(resolve(process.cwd(), 'dist', 'content', 'stories'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'dist', 'audio', 'stories'))).toBe(false);
  });
});
