import { transliterate } from '../domain/letters';

export type InterfaceScript = 'cyrillic' | 'latin';

const LATIN_SINGLE: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', đ: 'ђ', e: 'е', ž: 'ж', z: 'з',
  i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
  s: 'с', t: 'т', ć: 'ћ', u: 'у', f: 'ф', h: 'х', c: 'ц', č: 'ч', š: 'ш'
};

const LATIN_DIGRAPHS: Record<string, string> = {
  lj: 'љ',
  nj: 'њ',
  dž: 'џ'
};

function preserveCase(source: string, target: string): string {
  return source[0] === source[0].toLocaleUpperCase('sr-Latn')
    ? target.toLocaleUpperCase('sr-Cyrl')
    : target;
}

export function toCyrillic(value: string): string {
  let result = '';
  for (let index = 0; index < value.length;) {
    const pair = value.slice(index, index + 2);
    const pairLower = pair.toLocaleLowerCase('sr-Latn');
    if (LATIN_DIGRAPHS[pairLower]) {
      result += preserveCase(pair, LATIN_DIGRAPHS[pairLower]);
      index += 2;
      continue;
    }

    const character = value[index];
    const lower = character.toLocaleLowerCase('sr-Latn');
    const mapped = LATIN_SINGLE[lower];
    result += mapped ? preserveCase(character, mapped) : character;
    index += 1;
  }
  return result;
}

export function convertInterfaceText(value: string, script: InterfaceScript): string {
  return script === 'cyrillic' ? toCyrillic(value) : transliterate(value);
}

const TRANSLATED_ATTRIBUTES = ['aria-label', 'placeholder', 'title'] as const;

function isProtected(element: Element | null): boolean {
  return Boolean(element?.closest('[data-script-fixed="true"], script, style, code, pre'));
}

export function applyInterfaceScript(root: HTMLElement, script: InterfaceScript): void {
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!isProtected(node.parentElement)) {
        node.textContent = convertInterfaceText(node.textContent ?? '', script);
      }
      return;
    }
    for (const child of Array.from(node.childNodes)) visit(child);
  };

  visit(root);
  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    if (isProtected(element)) continue;
    for (const attribute of TRANSLATED_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, convertInterfaceText(value, script));
    }
  }
  root.lang = script === 'cyrillic' ? 'sr-Cyrl' : 'sr-Latn';
}

