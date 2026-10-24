import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(scriptDirectory, '../../slovoigra/lib/features/tracing/domain/letter_trace_guide.dart');
const outputPath = resolve(scriptDirectory, '../src/data/letterTraceGuides.ts');
const source = readFileSync(sourcePath, 'utf8');

function readDictionary(marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing guide map: ${marker}`);
  const open = source.indexOf('{', markerIndex);
  let depth = 0;
  let close = -1;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) {
      close = index;
      break;
    }
  }
  if (close < 0) throw new Error(`Unclosed guide map: ${marker}`);
  const body = source.slice(open + 1, close).replace(/\/\/[^\n]*/g, '');
  const entries = [...body.matchAll(/^\s*'([^']+)':\s*\[/gm)];
  const result = {};
  entries.forEach((entry, index) => {
    const start = entry.index + entry[0].length - 1;
    const end = entries[index + 1]?.index ?? body.length;
    const region = body.slice(start, end);
    let bracketDepth = 0;
    let stroke;
    const strokes = [];
    for (const token of region.matchAll(/\[|\]|Offset\(([-\d.]+),\s*([-\d.]+)\)/g)) {
      if (token[0] === '[') {
        bracketDepth += 1;
        if (bracketDepth === 2) stroke = [];
      } else if (token[0] === ']') {
        if (bracketDepth === 2 && stroke?.length) strokes.push(stroke);
        bracketDepth -= 1;
      } else if (bracketDepth === 2 && stroke) {
        stroke.push([Number(token[1]), Number(token[2])]);
      }
    }
    if (!strokes.length) throw new Error(`No strokes found for ${entry[1]}`);
    result[entry[1]] = strokes;
  });
  if (Object.keys(result).length !== 30) throw new Error(`Expected 30 guides in ${marker}, got ${Object.keys(result).length}`);
  return result;
}

const guides = {
  cyrillic: readDictionary('static const _cyrillicGuides'),
  latin: readDictionary('static const _latinGuides')
};
const output = `// Generated from products/slovoigra/lib/features/tracing/domain/letter_trace_guide.dart.\n` +
  `export const letterTraceGuides = ${JSON.stringify(guides, null, 2)} as const;\n`;
writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${outputPath} with 30 guides per script.`);
