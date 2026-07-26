export type FairyTaleAge = '4–6' | '7–10';
export type FairyTaleCategory = 'Bajke' | 'Životinje' | 'Pred spavanje';

export type FairyTale = {
  id: string;
  age: FairyTaleAge;
  category: FairyTaleCategory;
  title: string;
  art: string;
  sentences: string[];
  question: string;
  answers: string[];
  correct: string;
  audioKey: string;
};

type TaleSeed = {
  id: string;
  title: string;
  hero: string;
  place: string;
  treasure: string;
  helper: string;
  lesson: string;
  art: string;
  category: FairyTaleCategory;
};

const seeds: TaleSeed[] = [
  { id: 'pero', title: 'Светлуцаво перо', hero: 'Мила', place: 'у шуми', treasure: 'Светлуцаво перо', helper: 'мудра сова', lesson: 'добро дело увек осветли пут', art: '🪶 🦉 ✨', category: 'Bajke' },
  { id: 'zmaj', title: 'Змај који је волео дугу', hero: 'Вук', place: 'на шареном брду', treasure: 'Дугину звезду', helper: 'мали змај', lesson: 'различите боје су најлепше заједно', art: '🐉 🌈 ⭐', category: 'Bajke' },
  { id: 'jez', title: 'Јежево топло срце', hero: 'Јеца', place: 'на јесењој стази', treasure: 'Златни лист', helper: 'вредни јеж', lesson: 'пријатељство греје и хладне дане', art: '🦔 🍂 💛', category: 'Životinje' },
  { id: 'mesec', title: 'Месечев чамац', hero: 'Лука', place: 'поред мирног језера', treasure: 'Месечев чамац', helper: 'сребрна риба', lesson: 'храброст расте када верујемо себи', art: '🌙 🚣 🐟', category: 'Pred spavanje' },
  { id: 'pcelica', title: 'Пчелица и музички цвет', hero: 'Ана', place: 'у цветној башти', treasure: 'Распевани цвет', helper: 'весела пчелица', lesson: 'стрпљив рад доноси слатке плодове', art: '🐝 🌼 🎵', category: 'Životinje' },
  { id: 'oblak', title: 'Облак који је тражио дом', hero: 'Марко', place: 'изнад зелене долине', treasure: 'Капљицу смеха', helper: 'добри ветар', lesson: 'дом је тамо где нас чекају пријатељи', art: '☁️ 🌬️ 🌧️', category: 'Pred spavanje' },
  { id: 'lisica', title: 'Лисица и чаробна књига', hero: 'Нина', place: 'у старој библиотеци', treasure: 'Чаробну књигу', helper: 'радознала лисица', lesson: 'свака прочитана страна отвара нови свет', art: '🦊 📖 ✨', category: 'Životinje' },
  { id: 'dvorac', title: 'Тајна плавог дворца', hero: 'Огњен', place: 'крај плавог дворца', treasure: 'Кристални кључ', helper: 'насмејани витез', lesson: 'истина откључава и најтежа врата', art: '🏰 🔑 💎', category: 'Bajke' },
  { id: 'sova', title: 'Сова која није могла да спава', hero: 'Петра', place: 'у тихој шуми', treasure: 'Јастук од облака', helper: 'поспани месец', lesson: 'мирно дисање доноси лепе снове', art: '🦉 ☁️ 😴', category: 'Pred spavanje' },
  { id: 'kit', title: 'Мали кит и велика песма', hero: 'Сава', place: 'крај плавог мора', treasure: 'Шкољку која пева', helper: 'мали кит', lesson: 'и тих глас може да исприча велику причу', art: '🐋 🐚 🎶', category: 'Životinje' },
  { id: 'patuljak', title: 'Патуљак и сат од меда', hero: 'Тара', place: 'у меденој долини', treasure: 'Сат од меда', helper: 'вредни патуљак', lesson: 'за лепе ствари вреди сачекати', art: '🧙 🍯 ⏰', category: 'Bajke' },
  { id: 'srna', title: 'Срна и прва пахуља', hero: 'Ива', place: 'на снежној пољани', treasure: 'Прву пахуљу', helper: 'нежна срна', lesson: 'свако годишње доба носи своју радост', art: '🦌 ❄️ 🌲', category: 'Životinje' },
  { id: 'fenjer', title: 'Фењер за уснуло село', hero: 'Урош', place: 'у малом селу', treasure: 'Зелени фењер', helper: 'светлуцава свица', lesson: 'једно мало светло може помоћи свима', art: '🏮 🏡 ✨', category: 'Pred spavanje' },
  { id: 'princeza', title: 'Принцеза која је садила дрвеће', hero: 'Лана', place: 'у краљевској башти', treasure: 'Сребрно семе', helper: 'млада принцеза', lesson: 'оно што данас посадимо сутра даје хлад', art: '👸 🌱 🌳', category: 'Bajke' },
  { id: 'medved', title: 'Медведова тегла осмеха', hero: 'Бојан', place: 'поред шумске кућице', treasure: 'Теглу осмеха', helper: 'добродушни медвед', lesson: 'осмех постаје већи када га поделимо', art: '🐻 🫙 😊', category: 'Životinje' },
  { id: 'zvezda', title: 'Звезда која је пала у траву', hero: 'Рада', place: 'на мирисној ливади', treasure: 'Малу звезду', helper: 'брзи зец', lesson: 'помоћ пријатељу враћа сјај', art: '⭐ 🐇 🌿', category: 'Pred spavanje' },
  { id: 'jednorog', title: 'Једнорог и извор боја', hero: 'Филип', place: 'иза магловите планине', treasure: 'Извор боја', helper: 'бели једнорог', lesson: 'машта претвара сив дан у авантуру', art: '🦄 🎨 ⛰️', category: 'Bajke' },
  { id: 'delfin', title: 'Делфин чувар корала', hero: 'Хана', place: 'у топлом морском заливу', treasure: 'Корално срце', helper: 'разиграни делфин', lesson: 'море чувамо као сопствени дом', art: '🐬 🪸 💙', category: 'Životinje' },
  { id: 'jorgan', title: 'Јорган од звездане прашине', hero: 'Чеда', place: 'изнад успаваног града', treasure: 'Звездани јорган', helper: 'тиха ноћ', lesson: 'леп сан почиње мирном мишљу', art: '🌌 🛏️ 🌙', category: 'Pred spavanje' },
  { id: 'vila', title: 'Вила из мирисне баште', hero: 'Соња', place: 'међу ружама', treasure: 'Звонце од росе', helper: 'баштенска вила', lesson: 'нежне речи помажу свему да расте', art: '🧚 🌹 🔔', category: 'Bajke' },
  { id: 'vuk', title: 'Вук који је чувао птице', hero: 'Дуња', place: 'на ивици шуме', treasure: 'Плаво гнездо', helper: 'млади вук', lesson: 'снага је највреднија када штити слабије', art: '🐺 🪺 🐦', category: 'Životinje' },
  { id: 'voz', title: 'Ноћни воз за земљу снова', hero: 'Матеја', place: 'на месечевој станици', treasure: 'Карту за снове', helper: 'љубазни кондуктер', lesson: 'сваки сан је ново путовање', art: '🚂 🎫 🌙', category: 'Pred spavanje' },
  { id: 'kruna', title: 'Круна од добрих дела', hero: 'Маша', place: 'у далеком краљевству', treasure: 'Круну доброте', helper: 'стари краљ', lesson: 'најлепша круна прави се од добрих дела', art: '👑 🤝 ✨', category: 'Bajke' },
  { id: 'vidra', title: 'Видра и изгубљени каменчић', hero: 'Павле', place: 'поред брзе реке', treasure: 'Шарени каменчић', helper: 'весела видра', lesson: 'заједничка потрага постаје најлепша игра', art: '🦦 🌊 🪨', category: 'Životinje' },
  { id: 'zvonci', title: 'Звончићи за лаку ноћ', hero: 'Јована', place: 'у тихој планинској кући', treasure: 'Три сребрна звончића', helper: 'бака приповедачица', lesson: 'породичне приче чувају топлину дома', art: '🔔 🏠 😴', category: 'Pred spavanje' },
  { id: 'carobnjak', title: 'Чаробњак без чаробног штапа', hero: 'Алекса', place: 'у школи магије', treasure: 'Штап пријатељства', helper: 'збуњени чаробњак', lesson: 'знање и пријатељи вреде више од магије', art: '🧙‍♂️ 🪄 📚', category: 'Bajke' },
  { id: 'pingvin', title: 'Пингвинова летња авантура', hero: 'Мина', place: 'на леденом острву', treasure: 'Сунчани шешир', helper: 'радознали пингвин', lesson: 'ново искуство почиње једним храбрим кораком', art: '🐧 👒 ☀️', category: 'Životinje' },
  { id: 'svitac', title: 'Свитац који је бројао снове', hero: 'Никола', place: 'у ноћној башти', treasure: 'Књигу снова', helper: 'мали свитац', lesson: 'сваки леп сан заслужује да буде запамћен', art: '✨ 📘 🌙', category: 'Pred spavanje' },
  { id: 'ogledalo', title: 'Огледало храбре краљице', hero: 'Теодора', place: 'у дворани огледала', treasure: 'Огледало храбрости', helper: 'млада краљица', lesson: 'права храброст живи у нама', art: '🪞 👑 ❤️', category: 'Bajke' },
  { id: 'kornjaca', title: 'Корњача и трка са кишом', hero: 'Лазар', place: 'на шумској стази', treasure: 'Кишобран од листа', helper: 'упорна корњача', lesson: 'није важно колико брзо идемо ако не одустајемо', art: '🐢 ☔ 🍃', category: 'Životinje' }
];

function buildTale(seed: TaleSeed, index: number, age: FairyTaleAge): FairyTale {
  const alternativeOne = seeds[(index + 9) % seeds.length].treasure;
  const alternativeTwo = seeds[(index + 17) % seeds.length].treasure;
  const common = {
    id: `${seed.id}-${age.replace('–', '-')}`,
    age,
    category: seed.category,
    title: seed.title,
    art: seed.art,
    question: 'Шта је пронађено у причи?',
    answers: [seed.treasure, alternativeOne, alternativeTwo],
    correct: seed.treasure,
    audioKey: `${seed.id}-${age === '4–6' ? 'mali' : 'veliki'}`
  };
  if (age === '4–6') {
    return {
      ...common,
      sentences: [
        `${seed.hero} креће у нову авантуру ${seed.place}.`,
        `Тамо се појавио ${seed.helper} и затражио помоћ.`,
        `Заједно су пронашли ${seed.treasure.toLocaleLowerCase('sr')}.`,
        `Научили су да ${seed.lesson}.`
      ]
    };
  }
  return {
    ...common,
    sentences: [
      `Једног необичног јутра ${seed.hero} креће на путовање ${seed.place}.`,
      `На путу се појавио ${seed.helper} и затражио помоћ.`,
      `Пратили су тајанствене знакове и пажљиво слушали звуке око себе.`,
      `После дуге потраге пронашли су ${seed.treasure.toLocaleLowerCase('sr')}.`,
      `Налаз нису задржали само за себе, већ су радост поделили са другима.`,
      `Тога дана сви су разумели да ${seed.lesson}.`
    ]
  };
}

export const fairyTaleAges: FairyTaleAge[] = ['4–6', '7–10'];
export const fairyTales: FairyTale[] = fairyTaleAges.flatMap((age) =>
  seeds.map((seed, index) => buildTale(seed, index, age))
);
