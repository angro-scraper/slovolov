import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { removeStoreUnsafeStoryAssets } from './storeSafeAssets';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('prodavnički audio paket za tablete', () => {
  it('zadržava sažete snimke, a uklanja pune izvore priče', async () => {
    const root = await mkdtemp(join(tmpdir(), 'slovolov-store-audio-'));
    temporaryRoots.push(root);
    const audioRoot = join(root, 'audio', 'stories');
    const contentRoot = join(root, 'content', 'stories');
    mkdirSync(audioRoot, { recursive: true });
    mkdirSync(contentRoot, { recursive: true });

    writeFileSync(join(audioRoot, 'ivica-i-marica-sazeta-1.mp3'), 'tablet-narrator');
    writeFileSync(join(audioRoot, 'ivica-i-marica-full-1.mp3'), 'full-source');
    writeFileSync(join(audioRoot, 'ivica-i-marica-cela-1.mp3'), 'legacy-full-source');
    writeFileSync(join(contentRoot, 'ivica-i-marica.json'), '{}');

    removeStoreUnsafeStoryAssets(root);

    expect(existsSync(join(audioRoot, 'ivica-i-marica-sazeta-1.mp3'))).toBe(true);
    expect(existsSync(join(audioRoot, 'ivica-i-marica-full-1.mp3'))).toBe(false);
    expect(existsSync(join(audioRoot, 'ivica-i-marica-cela-1.mp3'))).toBe(false);
    expect(existsSync(contentRoot)).toBe(false);
  });
});
