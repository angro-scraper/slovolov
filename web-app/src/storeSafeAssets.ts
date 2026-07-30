import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

export function removeStoreUnsafeStoryAssets(outputRoot: string): void {
  rmSync(resolve(outputRoot, 'content', 'stories'), { recursive: true, force: true });

  const storyAudioRoot = resolve(outputRoot, 'audio', 'stories');
  if (!existsSync(storyAudioRoot)) return;

  for (const fileName of readdirSync(storyAudioRoot)) {
    // Store izdanje zadržava samo uzrasno prilagođene snimke. Puni izvori
    // (`*-full-*` i stariji `*-cela-*`) ne smeju u prodavnički paket.
    if (!/-sazeta-\d+\.mp3$/i.test(fileName)) {
      rmSync(resolve(storyAudioRoot, fileName), { recursive: true, force: true });
    }
  }
}
