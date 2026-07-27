import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fairyTales } from '../products/slovolov-web/src/data/fairyTales.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const python = join(root, '.venv', 'Scripts', 'python.exe');
const outputRoot = join(root, 'products', 'slovolov-web', 'public', 'audio', 'stories');
const voice = process.env.SLOVOLOV_TTS_VOICE || 'sr-RS-SophieNeural';
const concurrency = Math.max(1, Number(process.env.SLOVOLOV_TTS_CONCURRENCY || 2));
const maxAttempts = Math.max(3, Number(process.env.SLOVOLOV_TTS_ATTEMPTS || 8));
const uniqueStories = [...new Map(fairyTales.map((story) => [story.audioKey, story])).values()];
const fullStoryRoot = join(root, 'products', 'slovolov-web', 'public', 'content', 'stories');
const fullStoryManifest = existsSync(join(fullStoryRoot, 'manifest.json'))
  ? JSON.parse(readFileSync(join(fullStoryRoot, 'manifest.json'), 'utf8'))
  : [];
const fullStories = fullStoryManifest.map(({ id }) => {
  const path = join(fullStoryRoot, `${id}.json`);
  const content = JSON.parse(readFileSync(path, 'utf8'));
  return {
    ...content,
    path,
    audioKey: content.audio.key,
    sentences: content.pages.flat()
  };
});
const fullAudioKeys = new Set(fullStories.map(({ audioKey }) => audioKey));
// Kada postoji izvorno proverena cela priča, nikada ne pravimo njene prve
// segmente iz privremenog seed teksta. U suprotnom bi fajl sa istim imenom
// bio preskočen kada stigne stvarna rečenica iz cele priče.
const allStories = [
  ...uniqueStories.filter(({ audioKey }) => !fullAudioKeys.has(audioKey)),
  ...fullStories
];

if (!existsSync(python)) throw new Error(`Nedostaje projektni Python: ${python}`);
mkdirSync(outputRoot, { recursive: true });

const jobs = allStories.flatMap((story) =>
  story.sentences.map((sentence, index) => ({
    story,
    sentence,
    index,
    base: `${story.audioKey}-${index + 1}`
  }))
);

function runEdgeTts(job, attempt = 1) {
  const inputPath = join(outputRoot, `${job.base}.txt`);
  const outputPath = join(outputRoot, `${job.base}.mp3`);
  if (existsSync(outputPath) && statSync(outputPath).size > 1_000) {
    return Promise.resolve({ skipped: true, outputPath });
  }
  writeFileSync(inputPath, `${job.sentence}\n`, 'utf8');

  return new Promise((resolveJob, rejectJob) => {
    const child = spawn(
      python,
      [
        '-m', 'edge_tts',
        '--voice', voice,
        '--rate=-8%',
        '--pitch=+2Hz',
        '--file', inputPath,
        '--write-media', outputPath
      ],
      { cwd: root, windowsHide: true }
    );
    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
    child.on('error', rejectJob);
    child.on('close', async (code) => {
      rmSync(inputPath, { force: true });
      if (code === 0 && existsSync(outputPath) && statSync(outputPath).size > 1_000) {
        resolveJob({ skipped: false, outputPath });
        return;
      }
      rmSync(outputPath, { force: true });
      if (attempt < maxAttempts) {
        const backoff = Math.min(30_000, attempt * 5_000);
        process.stderr.write(
          `TTS pokušaj ${attempt}/${maxAttempts} nije uspeo za ${job.base}; ` +
          `ponavljanje za ${backoff / 1_000}s.\n`
        );
        await new Promise((done) => setTimeout(done, backoff));
        try {
          resolveJob(await runEdgeTts(job, attempt + 1));
        } catch (error) {
          rejectJob(error);
        }
        return;
      }
      rejectJob(new Error(`TTS nije uspeo za ${job.base}: ${errorOutput || `exit=${code}`}`));
    });
  });
}

let cursor = 0;
let completed = 0;
let created = 0;

async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor];
    cursor += 1;
    const result = await runEdgeTts(job);
    completed += 1;
    if (!result.skipped) created += 1;
    if (completed % 10 === 0 || completed === jobs.length) {
      process.stdout.write(`Audio: ${completed}/${jobs.length} (novo ${created})\n`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
for (const story of fullStories) {
  const content = JSON.parse(readFileSync(story.path, 'utf8'));
  content.audio.available = true;
  content.audio.sentenceCount = story.sentences.length;
  writeFileSync(story.path, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
}
process.stdout.write(`Završeno: ${jobs.length} segmenata, glas ${voice}.\n`);
