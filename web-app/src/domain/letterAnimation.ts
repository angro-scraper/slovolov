import { letters } from './letters';

export type LetterMotion = 'fly' | 'rise' | 'bounce' | 'sway' | 'spin' | 'pulse';

const letterIds = [
  'a', 'b', 'v', 'g', 'd', 'dj', 'e', 'zh', 'z', 'i', 'j', 'k', 'l', 'lj', 'm',
  'n', 'nj', 'o', 'p', 'r', 's', 't', 'tj', 'u', 'f', 'h', 'c', 'ch', 'dzh', 'sh'
];

const special: Record<string, { motion: LetterMotion; label: string }> = {
  a: { motion: 'fly', label: 'Avion poleće preko neba' },
  b: { motion: 'rise', label: 'Baloni lete nagore' },
  v: { motion: 'bounce', label: 'Vuk veselo poskakuje' },
  g: { motion: 'fly', label: 'Golub leti' },
  d: { motion: 'sway', label: 'Drvo se njiše na vetru' },
  dj: { motion: 'bounce', label: 'Đak veselo poskakuje' },
  e: { motion: 'spin', label: 'Ekser se okreće' },
  zh: { motion: 'bounce', label: 'Žaba skače' },
  z: { motion: 'bounce', label: 'Zec skakuće' },
  i: { motion: 'sway', label: 'Igračka pleše' },
  j: { motion: 'spin', label: 'Jabuka se kotrlja' },
  k: { motion: 'pulse', label: 'Kuća svetluca' },
  l: { motion: 'pulse', label: 'Lav veselo riče' },
  lj: { motion: 'sway', label: 'Ljuljaška se ljulja' },
  m: { motion: 'sway', label: 'Meda maše' },
  n: { motion: 'bounce', label: 'Nos se smešno mrda' },
  nj: { motion: 'sway', label: 'Njiva talasa na vetru' },
  o: { motion: 'bounce', label: 'Ovan veselo poskakuje' },
  p: { motion: 'sway', label: 'Pas veselo maše repom' },
  r: { motion: 'sway', label: 'Riba pliva' },
  s: { motion: 'pulse', label: 'Sunce sija' },
  t: { motion: 'sway', label: 'Traktor vozi' },
  tj: { motion: 'bounce', label: 'Ćurka veselo igra' },
  u: { motion: 'pulse', label: 'Uvo pažljivo sluša' },
  f: { motion: 'sway', label: 'Foka pliva' },
  h: { motion: 'bounce', label: 'Hleb poskakuje' },
  c: { motion: 'pulse', label: 'Cvet se otvara' },
  ch: { motion: 'sway', label: 'Čamac plovi' },
  dzh: { motion: 'bounce', label: 'Džem veselo poskakuje' },
  sh: { motion: 'sway', label: 'Šuma se njiše' }
};

export function getLetterAnimation(letter: string) {
  const normalized = letter.toLocaleUpperCase('sr');
  const index = letters.findIndex((item) => item.upper === normalized);
  return special[letterIds[index]] ?? { motion: 'pulse' as const, label: 'Ilustracija oživljava' };
}
