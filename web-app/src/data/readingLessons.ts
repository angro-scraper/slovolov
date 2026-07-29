export type RhymeRound = {
  id: string;
  prompt: string;
  options: [string, string, string];
  correct: string;
};

export type SyllableSet = {
  id: string;
  lead: string;
  syllables: [string, string, string, string, string];
};

export type WordReadingRound = {
  id: string;
  words: Array<{ word: string; image: string }>;
};

export const rhymeRounds: RhymeRound[] = [
  { id: 'mak', prompt: 'МАК', options: ['РАК', 'САТ', 'МИШ'], correct: 'РАК' },
  { id: 'dan', prompt: 'ДАН', options: ['САН', 'ПУТ', 'НОС'], correct: 'САН' },
  { id: 'cvet', prompt: 'ЦВЕТ', options: ['СВЕТ', 'ГРАД', 'ПАС'], correct: 'СВЕТ' },
  { id: 'kosa', prompt: 'КОСА', options: ['РОСА', 'ВОДА', 'КУЋА'], correct: 'РОСА' },
  { id: 'med', prompt: 'МЕД', options: ['ЛЕД', 'СОК', 'СИР'], correct: 'ЛЕД' },
  { id: 'mis', prompt: 'МИШ', options: ['КИШ', 'ЛАВ', 'ЗЕЦ'], correct: 'КИШ' },
  { id: 'zec', prompt: 'ЗЕЦ', options: ['МЕСЕЦ', 'ВОЗ', 'БРОД'], correct: 'МЕСЕЦ' },
  { id: 'suma', prompt: 'ШУМА', options: ['ГУМА', 'МОРЕ', 'СЕЛО'], correct: 'ГУМА' },
  { id: 'more', prompt: 'МОРЕ', options: ['ГОРЕ', 'ПОЉЕ', 'РЕКА'], correct: 'ГОРЕ' },
  { id: 'ptica', prompt: 'ПТИЦА', options: ['ЖИЦА', 'КЊИГА', 'ТРАВА'], correct: 'ЖИЦА' }
];

export const syllableSets: SyllableSet[] = [
  { id: 'm', lead: 'М', syllables: ['МА', 'МЕ', 'МИ', 'МО', 'МУ'] },
  { id: 's', lead: 'С', syllables: ['СА', 'СЕ', 'СИ', 'СО', 'СУ'] },
  { id: 'l', lead: 'Л', syllables: ['ЛА', 'ЛЕ', 'ЛИ', 'ЛО', 'ЛУ'] },
  { id: 'r', lead: 'Р', syllables: ['РА', 'РЕ', 'РИ', 'РО', 'РУ'] },
  { id: 'n', lead: 'Н', syllables: ['НА', 'НЕ', 'НИ', 'НО', 'НУ'] }
];

export const wordReadingRounds: WordReadingRound[] = [
  { id: 'home', words: [{ word: 'МАМА', image: '👩' }, { word: 'СОВА', image: '🦉' }, { word: 'ШУМА', image: '🌲' }] },
  { id: 'family', words: [{ word: 'ТАТА', image: '👨' }, { word: 'БЕБА', image: '👶' }, { word: 'КУЋА', image: '🏠' }] },
  { id: 'animals', words: [{ word: 'МЕДА', image: '🐻' }, { word: 'РИБА', image: '🐟' }, { word: 'ПАТКА', image: '🦆' }] },
  { id: 'nature', words: [{ word: 'СУНЦЕ', image: '☀️' }, { word: 'РЕКА', image: '🏞️' }, { word: 'ЦВЕТ', image: '🌷' }] },
  { id: 'food', words: [{ word: 'ХЛЕБ', image: '🍞' }, { word: 'СИР', image: '🧀' }, { word: 'ЈАБУКА', image: '🍎' }] },
  { id: 'travel', words: [{ word: 'АВИОН', image: '✈️' }, { word: 'ВОЗ', image: '🚂' }, { word: 'БРОД', image: '⛵' }] },
  { id: 'play', words: [{ word: 'ЛОПТА', image: '⚽' }, { word: 'ЛУТКА', image: '🪆' }, { word: 'ЗМАЈ', image: '🪁' }] },
  { id: 'weather', words: [{ word: 'КИША', image: '🌧️' }, { word: 'СНЕГ', image: '❄️' }, { word: 'ОБЛАК', image: '☁️' }] },
  { id: 'garden', words: [{ word: 'ПЧЕЛА', image: '🐝' }, { word: 'ЛЕПТИР', image: '🦋' }, { word: 'ПУЖ', image: '🐌' }] },
  { id: 'school', words: [{ word: 'КЊИГА', image: '📖' }, { word: 'ОЛОВКА', image: '✏️' }, { word: 'ТОРБА', image: '🎒' }] }
];
