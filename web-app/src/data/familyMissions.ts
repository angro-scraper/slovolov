export type FamilyMission = {
  id: string;
  difficulty: 1 | 2 | 3;
  icon: string;
  title: string;
  childPrompt: string;
  parentPrompt: string;
  offline: true;
};

export const familyMissions: FamilyMission[] = [
  { id: 'm-items', difficulty: 1, icon: '🔎', title: 'Lov na slovo M', childPrompt: 'Pronađi tri predmeta na slovo M.', parentPrompt: 'Pomozite samo pitanjima: „Šta vidiš u ovoj sobi?“ Pohvalite trud, ne brzinu.', offline: true },
  { id: 'v-animal', difficulty: 1, icon: '🎨', title: 'Životinja na V', childPrompt: 'Nacrtaj životinju čije ime počinje slovom V.', parentPrompt: 'Razgovarajte o tome gde ta životinja živi i zajedno izgovorite njeno ime.', offline: true },
  { id: 'count-spoons', difficulty: 1, icon: '🥄', title: 'Brojanje u kuhinji', childPrompt: 'Donesi četiri kašike i prebroj ih naglas.', parentPrompt: 'Dodajte još jednu kašiku i pitajte koliko ih sada ima, bez pokazivanja odgovora.', offline: true },
  { id: 'shape-home', difficulty: 1, icon: '🔷', title: 'Oblici oko nas', childPrompt: 'Pronađi krug, kvadrat i pravougaonik u kući.', parentPrompt: 'Neka dete objasni po čemu je prepoznalo svaki oblik.', offline: true },
  { id: 'retell', difficulty: 2, icon: '💬', title: 'Prepričaj roditelju', childPrompt: 'Ispričaj šta se dogodilo u poslednjoj priči.', parentPrompt: 'Postavite otvorena pitanja: „Šta ti se najviše dopalo?“ i „Šta bi ti uradio?“', offline: true },
  { id: 'rhymes', difficulty: 2, icon: '🎵', title: 'Porodične rime', childPrompt: 'Pronađi dve reči koje se rimuju sa MAK.', parentPrompt: 'Smišljajte i smešne izmišljene reči; cilj je da dete čuje isti završetak.', offline: true },
  { id: 'family-words', difficulty: 2, icon: '👨‍👩‍👧', title: 'Reči naše porodice', childPrompt: 'Izaberi pet srpskih reči koje često koristite kod kuće.', parentPrompt: 'Zapišite reči u „porodični rečnik“ i objasnite kada ih koristite.', offline: true },
  { id: 'shop', difficulty: 2, icon: '🛒', title: 'Mala prodavnica', childPrompt: 'Izaberi tri stvari i dodeli im cenu od 1 do 10.', parentPrompt: 'Igrajte kupca i prodavca papirnim novcem ili nacrtanim novčićima.', offline: true },
  { id: 'interview', difficulty: 3, icon: '🎤', title: 'Intervju sa bakom ili dekom', childPrompt: 'Postavi tri pitanja o njihovom detinjstvu.', parentPrompt: 'Pomozite detetu da sasluša ceo odgovor i zatim prepriča jednu zanimljivost.', offline: true },
  { id: 'ending', difficulty: 3, icon: '📚', title: 'Novi završetak', childPrompt: 'Smisli drugačiji završetak omiljene priče.', parentPrompt: 'Prihvatite detetovu ideju i pitajte kako se svaki junak tada oseća.', offline: true },
  { id: 'time-plan', difficulty: 3, icon: '🕒', title: 'Plan našeg dana', childPrompt: 'Poređaj doručak, igru, ručak i spavanje.', parentPrompt: 'Povežite događaje sa delovima dana i pogledajte pune sate na časovniku.', offline: true },
  { id: 'theatre', difficulty: 3, icon: '🎭', title: 'Porodična predstava', childPrompt: 'Izaberi junaka i odglumi kratku avanturu.', parentPrompt: 'Podelite uloge, napravite tri scene i dozvolite detetu da vodi radnju.', offline: true }
];
