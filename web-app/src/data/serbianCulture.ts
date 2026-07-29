export type CultureCategory = 'pesma' | 'zagonetka' | 'običaj' | 'grad' | 'priroda' | 'rečnik';
export type CultureCard = {
  id: string;
  category: CultureCategory;
  level: 1 | 2 | 3;
  icon: string;
  titleCyrillic: string;
  titleLatin: string;
  fact: string;
  familyPrompt: string;
};

export const cultureCards: CultureCard[] = [
  { id: 'brzalica-mis', category: 'pesma', level: 1, icon: '🎵', titleCyrillic: 'Миш уз пушку', titleLatin: 'Miš uz pušku', fact: 'Брзалице вежбају јасан говор, слушање и правилно разликовање сличних гласова.', familyPrompt: 'Изговорите полако, па сваки пут мало брже.' },
  { id: 'brzalica-cetiri', category: 'pesma', level: 2, icon: '🎶', titleCyrillic: 'Четири чавчића', titleLatin: 'Četiri čavčića', fact: 'Понављање гласова Ч и Ћ помаже детету да чује разлику у српском изговору.', familyPrompt: 'Наизменично изговарајте Ч и Ћ, без оцењивања.' },
  { id: 'zagonetka-sunce', category: 'zagonetka', level: 1, icon: '☀️', titleCyrillic: 'Сунце', titleLatin: 'Sunce', fact: 'Сја без ватре, греје без руке и сваког јутра излази изнад хоризонта.', familyPrompt: 'Питајте дете шта нам сунце даје.' },
  { id: 'zagonetka-senka', category: 'zagonetka', level: 2, icon: '👤', titleCyrillic: 'Сенка', titleLatin: 'Senka', fact: 'Свуда иде са нама по светлости, али не можемо да је ухватимо руком.', familyPrompt: 'Направите сенке рукама на зиду.' },
  { id: 'slava', category: 'običaj', level: 2, icon: '🕯️', titleCyrillic: 'Крсна слава', titleLatin: 'Krsna slava', fact: 'Крсна слава је породични празник који окупља породицу и чува успомене и гостопримство.', familyPrompt: 'Разговарајте о обичајима ваше породице.' },
  { id: 'badnjak', category: 'običaj', level: 3, icon: '🌿', titleCyrillic: 'Бадњи дан', titleLatin: 'Badnji dan', fact: 'Бадњи дан прати више породичних обичаја који се разликују од краја до краја.', familyPrompt: 'Питајте старије како се празник обележавао у њиховом детињству.' },
  { id: 'beograd', category: 'grad', level: 1, icon: '🏰', titleCyrillic: 'Београд', titleLatin: 'Beograd', fact: 'Београд лежи на ушћу Саве у Дунав и познат је по Калемегданској тврђави.', familyPrompt: 'Пронађите Саву и Дунав на карти.' },
  { id: 'novi-sad', category: 'grad', level: 2, icon: '🌉', titleCyrillic: 'Нови Сад', titleLatin: 'Novi Sad', fact: 'Нови Сад лежи крај Дунава, а изнад реке се види Петроварадинска тврђава.', familyPrompt: 'Нацртајте мост преко реке.' },
  { id: 'nis', category: 'grad', level: 2, icon: '🏛️', titleCyrillic: 'Ниш', titleLatin: 'Niš', fact: 'Ниш је један од најстаријих градова у овом делу Европе и налази се на реци Нишави.', familyPrompt: 'Изговорите заједно Ниш и Нишава.' },
  { id: 'tara', category: 'priroda', level: 1, icon: '🌲', titleCyrillic: 'Тара', titleLatin: 'Tara', fact: 'Национални парк Тара чува густе шуме и ретку Панчићеву оморику.', familyPrompt: 'Разговарајте зашто је важно чувати шуме.' },
  { id: 'djerdap', category: 'priroda', level: 2, icon: '🌊', titleCyrillic: 'Ђердап', titleLatin: 'Đerdap', fact: 'Ђердап је велика клисура Дунава са стрмим странама и важним природним стаништима.', familyPrompt: 'Покажите рукама како река пролази између планина.' },
  { id: 'beli-orao', category: 'priroda', level: 2, icon: '🦅', titleCyrillic: 'Орао белорепан', titleLatin: 'Orao belorepan', fact: 'Орао белорепан је велика птица грабљивица која живи крај река и влажних станишта.', familyPrompt: 'Раширите руке као крила и опишите лет.' },
  { id: 'hvala', category: 'rečnik', level: 1, icon: '💛', titleCyrillic: 'Хвала', titleLatin: 'Hvala', fact: 'Реч хвала показује захвалност и једна је од важних љубазних речи у свакодневном говору.', familyPrompt: 'Наведите три ствари за које сте данас захвални.' },
  { id: 'izvoli', category: 'rečnik', level: 1, icon: '🤲', titleCyrillic: 'Изволи', titleLatin: 'Izvoli', fact: 'Изволи кажемо када нешто дајемо, нудимо или љубазно пуштамо некога да прође.', familyPrompt: 'Одглумите кратак љубазан разговор.' },
  { id: 'promaja', category: 'rečnik', level: 2, icon: '🌬️', titleCyrillic: 'Промаја', titleLatin: 'Promaja', fact: 'Промаја је струјање ваздуха кроз простор када су отвори на различитим странама отворени.', familyPrompt: 'Покажите где ваздух улази и излази.' },
  { id: 'kolo', category: 'pesma', level: 3, icon: '🕺', titleCyrillic: 'Коло', titleLatin: 'Kolo', fact: 'Коло је групна игра у којој се играчи држе и крећу у заједничком ритму.', familyPrompt: 'Направите мали круг и корачајте заједно.' },
  { id: 'ajvar', category: 'običaj', level: 2, icon: '🫑', titleCyrillic: 'Ајвар', titleLatin: 'Ajvar', fact: 'Ајвар се најчешће прави од печене паприке и део је породичне јесење припреме хране.', familyPrompt: 'Набројте боје паприка које познајете.' },
  { id: 'pobednik', category: 'grad', level: 3, icon: '🗿', titleCyrillic: 'Победник', titleLatin: 'Pobednik', fact: 'Споменик Победник стоји на Калемегдану и гледа према ушћу Саве у Дунав.', familyPrompt: 'Опишите шта се све види са високог места.' }
];
