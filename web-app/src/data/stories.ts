export type ReadingAge = '4–6' | '6–8' | '8–10';

export type ReadingStory = {
  id: string;
  age: ReadingAge;
  art: string;
  title: string;
  sentences: string[];
  question: string;
  answers: string[];
  correct: string;
};

type AdventureSeed = {
  id: string;
  name: string;
  destination: string;
  objectAccusative: string;
  answer: string;
  art: string;
};

const adventures: AdventureSeed[] = [
  { id: 'lana-cvet', name: 'Лана', destination: 'врта', objectAccusative: 'црвени цвет', answer: 'Цвет', art: '🌷 🐞 🌞' },
  { id: 'vuk-zmaj', name: 'Вук', destination: 'брда', objectAccusative: 'плавог змаја', answer: 'Змаја', art: '🐉 ⛰️ ☁️' },
  { id: 'mila-sova', name: 'Мила', destination: 'шуме', objectAccusative: 'мудру сову', answer: 'Сову', art: '🦉 🌲 🌙' },
  { id: 'luka-kljuc', name: 'Лука', destination: 'старог храста', objectAccusative: 'мали кључ', answer: 'Кључ', art: '🌳 🔑 🐿️' },
  { id: 'ana-balon', name: 'Ана', destination: 'парка', objectAccusative: 'жути балон', answer: 'Балон', art: '🎈 🌳 🛝' },
  { id: 'bojan-brod', name: 'Бојан', destination: 'реке', objectAccusative: 'дрвени брод', answer: 'Брод', art: '⛵ 🌊 🐟' },
  { id: 'iva-jez', name: 'Ива', destination: 'ливаде', objectAccusative: 'малог јежа', answer: 'Јежа', art: '🦔 🌿 🍄' },
  { id: 'marko-kompas', name: 'Марко', destination: 'планине', objectAccusative: 'стари компас', answer: 'Компас', art: '🧭 ⛰️ 🥾' },
  { id: 'nina-zvono', name: 'Нина', destination: 'сеоског трга', objectAccusative: 'сребрно звоно', answer: 'Звоно', art: '🔔 🏡 🌼' },
  { id: 'ognjen-knjiga', name: 'Огњен', destination: 'библиотеке', objectAccusative: 'књигу о звездама', answer: 'Књигу', art: '📚 ⭐ 🔭' },
  { id: 'petra-leptir', name: 'Петра', destination: 'цветне баште', objectAccusative: 'шареног лептира', answer: 'Лептира', art: '🦋 🌺 🌈' },
  { id: 'rada-skoljka', name: 'Рада', destination: 'морске обале', objectAccusative: 'белу шкољку', answer: 'Шкољку', art: '🐚 🌊 ☀️' },
  { id: 'sava-voz', name: 'Сава', destination: 'железничке станице', objectAccusative: 'црвени воз', answer: 'Воз', art: '🚂 🚉 🌄' },
  { id: 'tara-zvezda', name: 'Тара', destination: 'тихе пољане', objectAccusative: 'сјајну звезду', answer: 'Звезду', art: '⭐ 🌙 🐇' },
  { id: 'uros-fenjer', name: 'Урош', destination: 'старе куле', objectAccusative: 'зелени фењер', answer: 'Фењер', art: '🏰 🏮 🌌' },
  { id: 'filip-robot', name: 'Филип', destination: 'радионице', objectAccusative: 'малог робота', answer: 'Робота', art: '🤖 🔧 ⚙️' },
  { id: 'hana-mace', name: 'Хана', destination: 'дворишта', objectAccusative: 'бело маче', answer: 'Маче', art: '🐈 🏠 💛' },
  { id: 'cana-kosara', name: 'Цана', destination: 'воћњака', objectAccusative: 'корпу јабука', answer: 'Корпу', art: '🍎 🧺 🌳' },
  { id: 'ceda-camac', name: 'Чеда', destination: 'мирног језера', objectAccusative: 'мали чамац', answer: 'Чамац', art: '🚣 🌊 🦆' },
  { id: 'sana-lopta', name: 'Шана', destination: 'школског игралишта', objectAccusative: 'шарену лопту', answer: 'Лопту', art: '⚽ 🌈 🏫' }
];

export const storyAges: ReadingAge[] = ['4–6', '6–8', '8–10'];

function makeStory(seed: AdventureSeed, age: ReadingAge, index: number): ReadingStory {
  const nextAnswer = adventures[(index + 7) % adventures.length].answer;
  const lastAnswer = adventures[(index + 13) % adventures.length].answer;
  const common = {
    id: `${seed.id}-${age.replace('–', '-')}`,
    age,
    art: seed.art,
    question: `Шта проналази ${seed.name}?`,
    answers: [seed.answer, nextAnswer, lastAnswer],
    correct: seed.answer
  };

  if (age === '4–6') {
    return {
      ...common,
      title: `Мала авантура: ${seed.name}`,
      sentences: [
        `${seed.name} иде до ${seed.destination}.`,
        `Тамо види ${seed.objectAccusative}.`
      ]
    };
  }
  if (age === '6–8') {
    return {
      ...common,
      title: `Чудесни дан: ${seed.name}`,
      sentences: [
        `${seed.name} креће до ${seed.destination} у нову авантуру.`,
        `На стази проналази ${seed.objectAccusative}.`,
        `Код куће свима прича шта се догодило.`
      ]
    };
  }
  return {
    ...common,
    title: `Велика тајна: ${seed.name}`,
    sentences: [
      `Током пута до ${seed.destination}, ${seed.name} примећује необичан траг.`,
      `Траг води до ${seed.objectAccusative}, пажљиво сакривеног поред стазе.`,
      `На крају ${seed.name} чува налаз и записује целу пустоловину.`
    ]
  };
}

export const readingStories: ReadingStory[] = storyAges.flatMap((age) =>
  adventures.map((seed, index) => makeStory(seed, age, index))
);
