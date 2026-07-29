export type AdventureRoute =
  | 'voice'
  | 'reading'
  | 'family-missions'
  | 'adaptive'
  | 'creative'
  | 'logic'
  | 'culture'
  | 'quiz';

export type AdventureLevel = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  icon: string;
  difficulty: number;
  route: AdventureRoute;
};

export type AdventureWorld = {
  id: string;
  title: string;
  description: string;
  color: string;
  levels: AdventureLevel[];
};

const level = (
  id: string,
  order: number,
  title: string,
  subtitle: string,
  icon: string,
  difficulty: number,
  route: AdventureRoute
): AdventureLevel => ({ id, order, title, subtitle, icon, difficulty, route });

export const adventureWorlds: AdventureWorld[] = [
  {
    id: 'voice',
    title: 'Sovicina šuma glasova',
    description: 'Slušaj, ponovi i pronađi glas.',
    color: '#6d5dfc',
    levels: [
      level('voice-1', 1, 'Prvi glas', 'Poslušaj i ponovi jedno slovo.', '🎙️', 1, 'voice'),
      level('voice-2', 2, 'Slovo i slika', 'Poveži glas sa poznatom slikom.', '🖼️', 2, 'voice'),
      level('voice-3', 3, 'Dva slična glasa', 'Razlikuj S i Š.', '👂', 3, 'voice'),
      level('voice-4', 4, 'Moja prva reč', 'Snimi i preslušaj kratku reč.', '🗣️', 4, 'voice'),
      level('voice-5', 5, 'Teške reči', 'Vežbaj LJ, NJ, DŽ, Đ i Ć.', '🦉', 5, 'voice'),
      level('voice-6', 6, 'Sovicin izazov', 'Izgovori celu kratku rečenicu.', '🏅', 6, 'voice')
    ]
  },
  {
    id: 'reading',
    title: 'Dolina čitanja',
    description: 'Od slogova do priče sa pitanjima.',
    color: '#16a76a',
    levels: [
      level('reading-1', 7, 'Slogovi', 'MA, ME, MI, MO, MU.', '🔡', 1, 'reading'),
      level('reading-2', 8, 'Kratke reči', 'Čitaj reči od dva sloga.', '📖', 2, 'reading'),
      level('reading-3', 9, 'Rečenice', 'Čitaj jednu po jednu rečenicu.', '✏️', 3, 'reading'),
      level('reading-4', 10, 'Mala priča', 'Priča i jedno pitanje.', '📗', 4, 'reading'),
      level('reading-5', 11, 'Čitam naglas', 'Snimi svoje čitanje lokalno.', '🎧', 5, 'reading'),
      level('reading-6', 12, 'Razumem priču', 'Pročitaj, zaključi i odgovori.', '🏆', 6, 'reading')
    ]
  },
  {
    id: 'family',
    title: 'Porodična livada',
    description: 'Kratke misije sa roditeljem, bez ekrana.',
    color: '#f59e0b',
    levels: [
      level('family-1', 13, 'Pronađi predmet', 'Tražite stvari na zadato slovo.', '🔎', 1, 'family-missions'),
      level('family-2', 14, 'Nacrtajte zajedno', 'Nacrtajte životinju ili predmet.', '🎨', 2, 'family-missions'),
      level('family-3', 15, 'Ispričaj priču', 'Dete prepričava roditelju.', '💬', 3, 'family-missions'),
      level('family-4', 16, 'Igra rimovanja', 'Smislite reči koje se rimuju.', '🎵', 4, 'family-missions'),
      level('family-5', 17, 'Porodični intervju', 'Postavi tri pitanja starijima.', '👨‍👩‍👧', 5, 'family-missions'),
      level('family-6', 18, 'Naša mala predstava', 'Odglumite zajedničku priču.', '🎭', 6, 'family-missions')
    ]
  },
  {
    id: 'logic',
    title: 'Planina brojeva',
    description: 'Brojevi, oblici, vreme, novac i logika.',
    color: '#0ea5e9',
    levels: [
      level('logic-1', 19, 'Sabiranje slikama', 'Spoji dve male grupe.', '➕', 1, 'logic'),
      level('logic-2', 20, 'Oduzimanje slikama', 'Koliko je ostalo?', '➖', 2, 'logic'),
      level('logic-3', 21, 'Veće i manje', 'Uporedi dve količine.', '⚖️', 3, 'logic'),
      level('logic-4', 22, 'Nizovi i oblici', 'Pronađi šta dolazi sledeće.', '🔷', 4, 'logic'),
      level('logic-5', 23, 'Sat i novac', 'Prepoznaj vreme i novčiće.', '🕒', 5, 'logic'),
      level('logic-6', 24, 'Mali logičar', 'Reši zadatak u više koraka.', '🧩', 6, 'logic')
    ]
  },
  {
    id: 'creative',
    title: 'Atelje Mojih knjiga',
    description: 'Od prvog junaka do cele ilustrovane audio-priče.',
    color: '#a855f7',
    levels: [
      level('creative-1', 25, 'Moj junak', 'Izaberi junaka svoje priče.', '🐉', 1, 'creative'),
      level('creative-2', 26, 'Čudesno mesto', 'Odluči gde se priča događa.', '🏞️', 2, 'creative'),
      level('creative-3', 27, 'Velika pustolovina', 'Izaberi problem koji junak rešava.', '🗝️', 3, 'creative'),
      level('creative-4', 28, 'Prijatelj pomaže', 'Dodaj pomoćnika i srećan kraj.', '🤝', 4, 'creative'),
      level('creative-5', 29, 'Moja naslovnica', 'Nacrtaj ilustraciju svoje knjige.', '🎨', 5, 'creative'),
      level('creative-6', 30, 'Ja sam pripovedač', 'Snimi celu priču svojim glasom.', '🎙️', 6, 'creative')
    ]
  },
  {
    id: 'heritage',
    title: 'Zvezdani put Srbije',
    description: 'Jezik, priroda, gradovi i običaji.',
    color: '#ec4899',
    levels: [
      level('culture-1', 31, 'Brzalice', 'Vežbaj čist i jasan govor.', '🎶', 1, 'culture'),
      level('culture-2', 32, 'Zagonetke', 'Pogodi životinju ili predmet.', '❓', 2, 'culture'),
      level('culture-3', 33, 'Priroda Srbije', 'Upoznaj reke, planine i životinje.', '🏞️', 3, 'culture'),
      level('culture-4', 34, 'Gradovi', 'Pronađi grad i njegovu znamenitost.', '🏙️', 4, 'culture'),
      level('culture-5', 35, 'Praznici i običaji', 'Razgovaraj sa porodicom o tradiciji.', '🎄', 5, 'culture'),
      level('culture-6', 36, 'Srpski kod kuće', 'Završi veliki porodični izazov.', '🌟', 6, 'culture')
    ]
  }
];

export function isAdventureLevelUnlocked(levelToCheck: AdventureLevel, completed: string[]): boolean {
  if (levelToCheck.order === 1) return true;
  const previous = adventureWorlds
    .flatMap((world) => world.levels)
    .find((item) => item.order === levelToCheck.order - 1);
  return Boolean(previous && completed.includes(previous.id));
}

export function getAdventureProgress(completed: string[]) {
  const all = adventureWorlds.flatMap((world) => world.levels);
  const completedSet = new Set(completed);
  const completedCount = all.filter((item) => completedSet.has(item.id)).length;
  return {
    completed: completedCount,
    total: all.length,
    percent: Math.round(completedCount / all.length * 100)
  };
}
