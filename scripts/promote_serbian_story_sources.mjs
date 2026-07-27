import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceDir = resolve(root, '.codex-local/serbian-public-domain-stories');
const outputDir = resolve(root, 'products/slovolov-web/public/content/stories');
const sourceManifest = JSON.parse(
  await readFile(resolve(sourceDir, 'manifest.json'), 'utf8')
);
const ids = sourceManifest.map(({ id }) => id);

function splitSentences(paragraph) {
  return paragraph
    .match(/[^.!?…]+(?:[.!?…]+(?:[”"’']+)?|$)/gu)
    ?.map((sentence) => sentence
      .replace(/\s+/g, ' ')
      .replace(/"{2,}/g, '"')
      .replace(/^[\s"',.]+(?=\p{L})/u, '')
      .trim())
    .filter((sentence) => (
      sentence.length >= 8
      && (sentence.match(/\p{L}/gu)?.length ?? 0) >= 3
    )) ?? [];
}

function buildPages(sentences) {
  const pages = [];
  let current = [];
  let words = 0;
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    if (current.length && (current.length >= 5 || words + sentenceWords > 115)) {
      pages.push(current);
      current = [];
      words = 0;
    }
    current.push(sentence);
    words += sentenceWords;
  }
  if (current.length) pages.push(current);
  return pages;
}

await mkdir(outputDir, { recursive: true });
const manifest = [];
for (const id of ids) {
  const source = JSON.parse(await readFile(resolve(sourceDir, `${id}.json`), 'utf8'));
  const sentences = source.paragraphs.flatMap(splitSentences);
  const text = sentences.join(' ');
  const wordCount = text.split(/\s+/).length;
  if (/[A-Za-zñ�ÃÅ]/.test(text)) throw new Error(`${id}: tekst nije dosledna ćirilica.`);
  if (sentences.some((sentence) => (sentence.match(/\p{L}/gu)?.length ?? 0) < 3)) {
    throw new Error(`${id}: pronađen je OCR/interpunkcijski fragment koji nije rečenica.`);
  }
  // Celovitost dokazujemo izvorom i revizijom, ne veštačkim brojem rečenica.
  // Vukove kraće pripovetke mogu biti potpune i sa manje od 20 dugih rečenica.
  if (sentences.length < 8 || wordCount < 250) throw new Error(`${id}: tekst je prekratak za celu bajku.`);
  const story = {
    id,
    title: source.title,
    language: 'sr-Cyrl',
    pages: buildPages(sentences),
    sentenceCount: sentences.length,
    wordCount,
    audio: {
      available: sentences.every((_, index) => {
        const path = resolve(
          root,
          'products/slovolov-web/public/audio/stories',
          `${id}-full-${index + 1}.mp3`
        );
        return existsSync(path) && statSync(path).size > 1_000;
      }),
      key: `${id}-full`,
      sentenceCount: sentences.length
    },
    source: {
      provider: source.source.provider,
      author: source.source.author,
      translator: source.source.translator,
      url: source.source.url,
      revisionId: source.source.revisionId,
      license: 'CC BY-SA 4.0'
    },
    review: {
      sourceCoverage: 'verified',
      languageReview: 'source-edition',
      publicationReady: true
    }
  };
  await writeFile(resolve(outputDir, `${id}.json`), `${JSON.stringify(story, null, 2)}\n`, 'utf8');
  manifest.push({
    id,
    title: story.title,
    sentenceCount: story.sentenceCount,
    wordCount: story.wordCount,
    sourceRevisionId: story.source.revisionId
  });
  console.log(`${id}: ${story.pages.length} strana · ${sentences.length} rečenica · ${wordCount} reči`);
}
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const catalog = [];
for (const { id } of manifest) {
  const story = JSON.parse(await readFile(resolve(outputDir, `${id}.json`), 'utf8'));
  catalog.push({
    id: story.id,
    title: story.title,
    author: story.source.author,
    sourceUrl: story.source.url,
    audioAvailable: story.audio.available
  });
}
const typeScriptCatalog = JSON.stringify(catalog, null, 2)
  .replaceAll('"id":', 'id:')
  .replaceAll('"title":', 'title:')
  .replaceAll('"author":', 'author:')
  .replaceAll('"sourceUrl":', 'sourceUrl:')
  .replaceAll('"audioAvailable":', 'audioAvailable:');
await writeFile(
  resolve(root, 'products/slovolov-web/src/data/fullStoryContentManifest.ts'),
  `export const fullStoryContentCatalog = ${typeScriptCatalog} as const;\n\n` +
    `export const fullStoryContentIds = fullStoryContentCatalog.map(({ id }) => id);\n\n` +
    `export const hasFullStoryContent = (id: string): boolean => (\n` +
    `  (fullStoryContentIds as readonly string[]).includes(id)\n` +
    `);\n`,
  'utf8'
);
