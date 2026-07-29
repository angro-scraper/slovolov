export type CreativeHero = {
  name: string;
  emoji: string;
  quality: string;
  talent: string;
};

export type CreativePlace = {
  label: string;
  emoji: string;
  arrival: string;
  secret: string;
};

export type CreativeQuest = {
  label: string;
  problem: string;
  action: string;
  discovery: string;
};

export type CreativeHelper = {
  name: string;
  emoji: string;
  gift: string;
  advice: string;
};

export type CreativeEnding = {
  label: string;
  celebration: string;
  lesson: string;
};

export type CreativeStory = {
  title: string;
  paragraphs: [string, string, string, string];
  text: string;
};

export const creativeHeroes: CreativeHero[] = [
  { name: 'Змај Пламенко', emoji: '🐉', quality: 'храбар и радознао', talent: 'умео је да малим пламеном осветли и најтамнији пут' },
  { name: 'Лисица Лана', emoji: '🦊', quality: 'мудра и пажљива', talent: 'примећивала је трагове које нико други није видео' },
  { name: 'Сова Софија', emoji: '🦉', quality: 'стрпљива и маштовита', talent: 'знала је причу за сваку звезду на небу' },
  { name: 'Пчела Зуја', emoji: '🐝', quality: 'вредна и весела', talent: 'песмом је могла да охрабри сваког пријатеља' }
];

export const creativePlaces: CreativePlace[] = [
  { label: 'чаробној шуми', emoji: '🌳', arrival: 'лишће је шапутало имена свих добрих путника', secret: 'испод најстаријег храста су се крила врата без кваке' },
  { label: 'звезданом граду', emoji: '🌟', arrival: 'улице су светлуцале као небо после кише', secret: 'градски сат је стао баш минут пре поноћи' },
  { label: 'тајном острву', emoji: '🏝️', arrival: 'таласи су на песку исписивали загонетке', secret: 'иза водопада налазила се пећина пуна плавих кристала' },
  { label: 'шареној школи', emoji: '🏫', arrival: 'оловке су саме цртале, а књиге тихо певале', secret: 'једна празна страница чекала је причу која још није испричана' }
];

export const creativeQuests: CreativeQuest[] = [
  { label: 'Потрага за златним кључем', problem: 'златни кључ који отвара Ковчег добрих жеља нестао је без трага', action: 'пратио је низ светлуцавих отисака и решио три загонетке', discovery: 'кључ није био украден — уплашена веверица га је узела да ослободи своју породицу' },
  { label: 'Изгубљени другар', problem: 'мали јеж није могао да пронађе пут до свог дома', action: 'слушао је шум потока, гледао маховину и питао шумске становнике за помоћ', discovery: 'прави пут се појавио тек када су сви удружили своја знања' },
  { label: 'Песма која је нестала', problem: 'јутро је освануло без иједне песме и цео крај је постао необично тих', action: 'сакупио је звуке капи, ветра, корака и веселог смеха', discovery: 'најлепша мелодија настала је тек када је свако додао свој различити глас' },
  { label: 'Чување мале звезде', problem: 'мала звезда је пала са неба и њена светлост је полако бледела', action: 'направио је меко гнездо, пронашао Месечев путоказ и кренуо ка највишем брду', discovery: 'звезда је поново засјала када је осетила колико неко брине о њој' }
];

export const creativeHelpers: CreativeHelper[] = [
  { name: 'весели зец Скочко', emoji: '🐇', gift: 'мапу која се види само када је неко љубазан', advice: 'Најкраћи пут није увек и најбољи пут.' },
  { name: 'мала вила Искрица', emoji: '🧚', gift: 'прах који открива скривена слова', advice: 'Добра идеја постаје велика када је поделимо са другима.' },
  { name: 'корњача Тара', emoji: '🐢', gift: 'компас који показује према ономе коме је потребна помоћ', advice: 'Полако и пажљиво стиже се даље него журбом.' },
  { name: 'медвед Мрва', emoji: '🐻', gift: 'теглицу меда која враћа снагу уморним путницима', advice: 'Храброст значи покушати поново и када није лако.' }
];

export const creativeEndings: CreativeEnding[] = [
  { label: 'Велика прослава', celebration: 'Сви становници приредили су прославу са лампионима, музиком и колачима у облику звезда', lesson: 'највећа награда била је радост што је некоме помогао' },
  { label: 'Ново пријатељство', celebration: 'На повратку су сви ходали заједно и већ смишљали следећу пустоловину', lesson: 'нови пријатељ се проналази када пажљиво слушамо и отворимо срце' },
  { label: 'Тајна књига', celebration: 'У старој библиотеци појавила се књига у којој је цела њихова авантура била нацртана златним словима', lesson: 'сваки добар поступак постаје прича вредна памћења' },
  { label: 'Повратак под звездама', celebration: 'Небо је обасјало стазу до куће, а свака звезда затреперила је у знак поздрава', lesson: 'дом је најлепши када се у њега вратимо са новом причом и добрим делом' }
];

export function buildCreativeStory(input: {
  childName: string;
  hero: CreativeHero;
  place: CreativePlace;
  quest: CreativeQuest;
  helper: CreativeHelper;
  ending: CreativeEnding;
}): CreativeStory {
  const { childName, hero, place, quest, helper, ending } = input;
  const title = `${hero.name} и ${quest.label.toLocaleLowerCase('sr-Cyrl')}`;
  const paragraphs: CreativeStory['paragraphs'] = [
    `Једног сунчаног јутра, ${hero.name}, ${hero.quality} јунак, нашао се у ${place.label}. ${place.arrival.charAt(0).toLocaleUpperCase('sr-Cyrl')}${place.arrival.slice(1)}. Посебан таленат овог јунака био је необичан: ${hero.talent}.`,
    `Убрзо је сазнао нешто забрињавајуће: ${quest.problem}. Док је размишљао одакле да почне, приметио је нешто необично: ${place.secret}. Није одустао: ${quest.action}.`,
    `На путу је срео помоћника по имену ${helper.name}. Помоћник му је поклонио ${helper.gift} и рекао: „${helper.advice}“ Заједно су открили да ${quest.discovery}.`,
    `${ending.celebration}. ${hero.name} је разумео нешто важно: ${ending.lesson}. Тако се завршила авантура коју је осмислило дете по имену ${childName}, а нова прича већ је чекала иза следеће странице.`
  ];
  return { title, paragraphs, text: `${title}\n\n${paragraphs.join('\n\n')}` };
}
