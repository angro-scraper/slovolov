export type LogicKind = 'addition' | 'subtraction' | 'compare' | 'sequence' | 'shape' | 'time' | 'money' | 'logic';
export type LogicChallenge = {
  id: string;
  level: number;
  kind: LogicKind;
  icon: string;
  prompt: string;
  visual: string;
  answers: string[];
  correct: string;
  explanation: string;
};

export const logicChallenges: LogicChallenge[] = [
  { id: 'add-1', level: 1, kind: 'addition', icon: '➕', prompt: 'Koliko je zvezdica ukupno?', visual: '⭐⭐ + ⭐', answers: ['2', '3', '4'], correct: '3', explanation: 'Dve i jedna su tri.' },
  { id: 'sub-1', level: 2, kind: 'subtraction', icon: '➖', prompt: 'Tri jabuke, jednu smo pojeli. Koliko je ostalo?', visual: '🍎🍎🍎 − 🍎', answers: ['1', '2', '3'], correct: '2', explanation: 'Tri manje jedan jednako je dva.' },
  { id: 'compare-1', level: 3, kind: 'compare', icon: '⚖️', prompt: 'Na kojoj strani ima više?', visual: '🐝🐝  |  🐝🐝🐝', answers: ['Levo', 'Isto', 'Desno'], correct: 'Desno', explanation: 'Tri je više od dva.' },
  { id: 'sequence-1', level: 4, kind: 'sequence', icon: '🔁', prompt: 'Šta dolazi sledeće?', visual: '🔴 🔵 🔴 🔵 ?', answers: ['🔴', '🔵', '🟢'], correct: '🔴', explanation: 'Crveno i plavo se smenjuju.' },
  { id: 'shape-1', level: 5, kind: 'shape', icon: '🔷', prompt: 'Koji oblik ima tri stranice?', visual: '○  △  □', answers: ['Krug', 'Trougao', 'Kvadrat'], correct: 'Trougao', explanation: 'Trougao ima tri stranice.' },
  { id: 'time-1', level: 6, kind: 'time', icon: '🕒', prompt: 'Mala kazaljka je na tri, velika na dvanaest. Koliko je sati?', visual: '🕒', answers: ['2', '3', '6'], correct: '3', explanation: 'Časovnik pokazuje tri sata.' },
  { id: 'money-1', level: 7, kind: 'money', icon: '🪙', prompt: 'Imaš dva novčića od 5. Koliko je ukupno?', visual: '5 + 5', answers: ['5', '10', '15'], correct: '10', explanation: 'Pet i pet su deset.' },
  { id: 'logic-1', level: 8, kind: 'logic', icon: '🧩', prompt: 'Ana je viša od Ive. Iva je viša od Mie. Ko je najviši?', visual: 'Ana › Iva › Mia', answers: ['Ana', 'Iva', 'Mia'], correct: 'Ana', explanation: 'Ana je viša od obe devojčice.' }
];
