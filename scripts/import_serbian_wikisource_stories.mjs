import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputDir = resolve(root, '.codex-local/serbian-public-domain-stories');
const endpoint = 'https://sr.wikisource.org/w/api.php';
const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
const requestHeaders = { 'user-agent': 'PomagAI-Slovolov/2.7 (public-domain source verifier)' };

async function fetchWithRateLimit(url) {
  let response;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    response = await fetch(url, {
      headers: requestHeaders,
      signal: AbortSignal.timeout(30_000)
    });
    if (response.status !== 429) return response;
    await wait(attempt * 7_500);
  }
  return response;
}

const vukStory = (title) => ({
  title,
  page: title,
  author: 'Вук Стефановић Караџић',
  translator: null,
  editionYear: 1853
});

const stories = {
  'princeza-na-zrnu-graska': {
    title: 'Принцеза на зрну грашка',
    page: 'Принцеза на зрну грашка',
    author: 'Ханс Кристијан Андерсен',
    translator: 'Ђидо',
    editionYear: 1888
  },
  'ruzno-pace': {
    title: 'Ружно паче',
    page: 'Ružno pače',
    author: 'Ханс Кристијан Андерсен',
    translator: 'непознат',
    editionYear: null
  },
  'devojcica-sa-sibicama': {
    title: 'Девојчица са шибицама',
    page: 'Djevojcica sa sibicama',
    author: 'Ханс Кристијан Андерсен',
    translator: 'непознат',
    editionYear: null
  },
  'carevo-novo-odelo': {
    title: 'Царево ново одело',
    page: 'Carevo novo odelo',
    author: 'Ханс Кристијан Андерсен',
    translator: 'непознат',
    editionYear: null
  },
  pepeljuga: {
    title: 'Пепељуга',
    page: 'Пепељуга',
    author: 'Вук Стефановић Караџић',
    translator: null,
    editionYear: 1853
  },
  medjedovic: vukStory('Међедовић'),
  'cardak-ni-na-nebu-ni-na-zemlji': vukStory('Чардак ни на небу ни на земљи'),
  'nemusti-jezik': vukStory('Немушти језик'),
  'zlatna-jabuka-i-devet-paunica': vukStory('Златна јабука и девет пауница'),
  'stojsa-i-mladen': vukStory('Стојша и Младен'),
  'djavo-i-njegov-segrt': vukStory('Ђаво и његов шегрт'),
  'prava-se-muka-ne-da-sakriti': vukStory('Права се мука не да сакрити'),
  'azdaja-i-carev-sin': vukStory('Аждаја и царев син'),
  'zmija-mladozenja': vukStory('Змија младожења'),
  'djevojka-brza-od-konja': vukStory('Дјевојка бржа од коња'),
  'djevojka-cara-nadmudrila': vukStory('Дјевојка цара надмудрила'),
  'zlatoruni-ovan': vukStory('Златоруни ован'),
  'ko-manje-iste-vise-mu-se-daje': vukStory('Ко мање иште, више му се даје'),
  'kome-bog-pomaze-niko-mu-nauditi-ne-moze': vukStory('Коме Бог помаже, нико му наудити не може'),
  'kopanje-blaga': vukStory('Копање блага'),
  'kralj-i-cobanin': vukStory('Краљ и чобанин'),
  'lijepe-haljine-mnogo-kojeksta-ucine': vukStory('Лијепе хаљине много којешта учине'),
  'maceha-i-pastorka': vukStory('Маћеха и пасторка'),
  'milostiva-snaha-i-nemilostiva-svekrva': vukStory('Милостива снаха и немилостива свекрва'),
  'opet-zmija-mladozenja': vukStory('Опет змија младожења'),
  'ocina-zakletva': vukStory('Очина заклетва'),
  'pobratimski-darovi': vukStory('Побратимски дарови'),
  'pravda-i-krivda': vukStory('Правда и кривда'),
  'tri-jegulje': vukStory('Три јегуље'),
  usud: vukStory('Усуд'),
  'careva-kci-ovca': vukStory('Царева кћи овца'),
  'crno-jagnje': vukStory('Црно јагње'),
  'cudnovata-dlaka': vukStory('Чудновата длака'),
  'cudnovata-tica': vukStory('Чудновата тица'),
  'cudotvorni-noz': vukStory('Чудотворни нож'),
  'zla-maceha': vukStory('Зла маћеха'),
  'kako-su-radile-onako-su-i-prosle': vukStory('Како су радиле онако су и прошле')
};

const latinToCyrillic = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф',
  g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
  p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', y: 'у', z: 'з', ž: 'ж'
};

function toCyrillic(text) {
  const repaired = text.replaceAll('ñ', 'đ').replaceAll('Ñ', 'Đ');
  const output = [];
  for (let index = 0; index < repaired.length; index += 1) {
    const pair = repaired.slice(index, index + 2);
    const loweredPair = pair.toLowerCase();
    if (['lj', 'nj', 'dž'].includes(loweredPair)) {
      const letter = { lj: 'љ', nj: 'њ', dž: 'џ' }[loweredPair];
      output.push(pair[0] === pair[0].toUpperCase() ? letter.toUpperCase() : letter);
      index += 1;
      continue;
    }
    const character = repaired[index];
    const replacement = latinToCyrillic[character.toLowerCase()];
    output.push(replacement ? (character === character.toUpperCase() ? replacement.toUpperCase() : replacement) : character);
  }
  return output.join('');
}

function cleanExtract(text, title) {
  return text
    .replace(new RegExp(`^${title}\\s*`, 'u'), '')
    .replace(/\n(?:Преузето са|Категориј[ае]:?)[\s\S]*$/u, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanWikitext(text) {
  const poem = text.match(/<poem>([\s\S]*?)<\/poem>/iu)?.[1] ?? text;
  return poem
    .replace(/\{\{dropinitial\|([^}]+)\}\}/giu, '$1')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/giu, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
}

function splitParagraphs(text) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.split(/\s+/).length >= 3);
  if (paragraphs.length > 1 && paragraphs.every((paragraph) => paragraph.split(/\s+/).length < 350)) {
    return paragraphs;
  }
  const sentences = text.match(/[^.!?…]+(?:[.!?…]+|$)/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const grouped = [];
  for (let index = 0; index < sentences.length; index += 5) {
    grouped.push(sentences.slice(index, index + 5).join(' '));
  }
  return grouped;
}

async function fetchPage(id, metadata) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    action: 'query',
    prop: 'extracts|revisions',
    exlimit: '1',
    explaintext: '1',
    rvprop: 'ids|timestamp',
    redirects: '1',
    titles: metadata.page,
    format: 'json',
    origin: '*'
  }).toString();
  const response = await fetchWithRateLimit(url);
  if (!response.ok) throw new Error(`${id}: Wikizvornik HTTP ${response.status}`);
  const payload = await response.json();
  const page = Object.values(payload.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined || !page.extract) throw new Error(`${id}: stranica nije pronađena.`);
  let text = cleanExtract(page.extract, metadata.title);
  if (text.split(/\s+/).length < 100) {
    const parseUrl = new URL(endpoint);
    parseUrl.search = new URLSearchParams({
      action: 'parse',
      prop: 'wikitext',
      page: page.title,
      format: 'json',
      origin: '*'
    }).toString();
    await wait(1_000);
    const parseResponse = await fetchWithRateLimit(parseUrl);
    if (!parseResponse.ok) throw new Error(`${id}: Wikizvornik parse HTTP ${parseResponse.status}`);
    const parsed = await parseResponse.json();
    text = cleanWikitext(parsed.parse?.wikitext?.['*'] ?? '');
  }
  // Izvorna izdanja su ćirilična, ali OCR povremeno ubaci latinične
  // homoglife usred reči (npr. "нoћ"). Normalizujemo svaki takav znak.
  text = toCyrillic(text);
  text = text
    .replace(/\s+Ханс Кристијан Андерсен\s+Девојчица са шибицама\s*$/u, '')
    .trim();
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 3 || text.split(/\s+/).length < 100) {
    throw new Error(`${id}: preuzeti tekst nije celovit (${paragraphs.length} pasusa).`);
  }
  return {
    id,
    title: metadata.title,
    language: 'sr-Cyrl',
    paragraphs,
    source: {
      provider: 'Srpski Wikizvornik',
      page: page.title,
      url: `https://sr.wikisource.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
      author: metadata.author,
      translator: metadata.translator,
      editionYear: metadata.editionYear,
      revisionId: page.revisions?.[0]?.revid ?? null,
      revisionTimestamp: page.revisions?.[0]?.timestamp ?? null,
      retrievedAt: new Date().toISOString(),
      sha256: createHash('sha256').update(text).digest('hex')
    },
    review: {
      sourceCoverage: 'verified',
      languageReview: 'pending',
      publicationReady: false
    }
  };
}

await mkdir(outputDir, { recursive: true });
const manifest = [];
for (const [id, metadata] of Object.entries(stories)) {
  const outputPath = resolve(outputDir, `${id}.json`);
  const alreadyImported = existsSync(outputPath);
  const story = alreadyImported
    ? JSON.parse(await readFile(outputPath, 'utf8'))
    : await fetchPage(id, metadata);
  story.paragraphs = story.paragraphs.map(toCyrillic);
  story.source.sha256 = createHash('sha256').update(story.paragraphs.join('\n\n')).digest('hex');
  await writeFile(outputPath, `${JSON.stringify(story, null, 2)}\n`, 'utf8');
  if (!alreadyImported) {
    await wait(1_500);
  }
  manifest.push({ id, title: story.title, source: story.source });
  console.log(`${id}: ${story.paragraphs.length} pasusa · ${story.paragraphs.join(' ').split(/\s+/).length} reči`);
}
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
