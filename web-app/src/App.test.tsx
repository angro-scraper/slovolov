import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { quizQuestions } from './data/quizQuestions';
import { logicChallenges } from './data/logicChallenges';
import { rhymeRounds } from './data/readingLessons';
import { LATIN_ALPHABET, letters, transliterate } from './domain/letters';
import { adventureWorlds } from './domain/adventure';
import { clearFullStoryCache } from './services/fullStoryLibrary';
import { convertInterfaceText } from './services/interfaceScript';
import { useProgressStore } from './store/progress';

Object.defineProperty(window, 'speechSynthesis', {
  value: { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] },
  configurable: true
});
globalThis.SpeechSynthesisUtterance = class {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  constructor(text: string) { this.text = text; }
} as typeof SpeechSynthesisUtterance;

const firstFullStory = JSON.parse(readFileSync(
  resolve(process.cwd(), 'public', 'content', 'stories', 'princeza-na-zrnu-graska.json'),
  'utf8'
));

function stubFirstFullStory() {
  const request = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => firstFullStory
  });
  vi.stubGlobal('fetch', request);
  return request;
}

function unlockParentSettings() {
  fireEvent.change(screen.getByLabelText('Koliko je 4 + 3?'), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Otvori roditeljski deo' }));
}

function enableIosCommerce() {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
  vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
}

describe('Slovolov glavni tok', () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
    if (useProgressStore.getState().script !== 'latin') {
      useProgressStore.getState().toggleScript();
    }
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,crtez')
    });
  });
  afterEach(() => {
    cleanup();
    clearFullStoryCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('prikazuje novi dečji Slovolov logo na početnom ekranu', () => {
    render(<App />);

    expect(screen.getByRole('img', { name: 'Slovolov sova' })).toHaveAttribute(
      'src',
      '/icons/slovolov-icon-192.png'
    );
    expect(screen.getByRole('img', { name: 'Sovica, tvoj vodič kroz Slovolov' }).querySelector('img'))
      .toHaveAttribute('src', '/images/mascot-owl-v1.png');
  });

  it('na prvom ekranu prikazuje osam većih ulaza sa učenjem i pisanjem na početku', () => {
    render(<App />);

    const discovery = screen.getByRole('region', { name: 'Uči, čitaj i maštaj' });
    const cards = Array.from(discovery.querySelectorAll('button'));
    expect(cards).toHaveLength(8);
    expect(cards[0]).toHaveTextContent('Nauči slova');
    expect(cards[1]).toHaveTextContent('Piši slova');
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Dnevni izazov/i }));
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Moja lekcija/i }));
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Brojevi 0–100\. 101 brojeva/i }));
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Čitanje\. 60 kratkih priča/i }));
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Bajke i priče\. 37 naslova/i }));
    expect(discovery).toContainElement(screen.getByRole('button', { name: /Moja priča/i }));
    expect(screen.getByRole('heading', { name: 'Šta ćemo danas?' })).toBeVisible();
  });

  it('novi početni ekran zadržava direktan ulaz u Moj napredak', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moj napredak/i }));
    expect(screen.getByRole('heading', { name: 'Moj napredak' })).toBeVisible();
  });

  it('napredak sadrži kolekcije nalepnica koje zavise od naučenih slova', () => {
    useProgressStore.getState().learnLetter('А');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moj napredak/i }));

    expect(screen.getByRole('region', { name: 'Kolekcije nalepnica' })).toBeVisible();
    expect(screen.getByText('Životinje')).toBeVisible();
    expect(screen.getAllByLabelText(/osvojena nalepnica/)).not.toHaveLength(0);
    expect(screen.getAllByLabelText(/zaključana nalepnica/)).not.toHaveLength(0);
  });

  it('ilustrovane kartice dosledno povezuju igre, kviz, brojeve i čitanje', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));
    expect(screen.getByTestId('play-banner')).toHaveAccessibleName(/MALO IGRALIŠTE: Igraj i istražuj/i);
    expect(readFileSync(resolve(process.cwd(), 'src', 'styles.css'), 'utf8'))
      .toMatch(/\.letter-match-focus \.game-letter\s*\{[^}]*justify-self:\s*center;/);
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    expect(document.querySelectorAll('.memory-grid .card-back img')).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'Otvori memory karticu 1' }));
    expect(screen.getByRole('button', { name: 'Memory kartica 1: А' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Kviz/i }));
    expect(screen.getByTestId('play-banner')).toHaveAccessibleName(/PITANJE 1 OD 10: Mali detektiv/i);

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));
    expect(screen.getByTestId('play-banner')).toHaveAccessibleName(/BROJEVNA AVANTURA: Hajde da brojimo/i);

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));
    expect(screen.getByTestId('play-banner')).toHaveAccessibleName(/ČAROBNA ČITAONICA: Reči oživele/i);
  });

  it('igra sa slovom ima centriranu scenu, progres, slikovne kartice i jasnu povratnu reakciju', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));

    expect(screen.getByRole('progressbar', { name: 'Napredak kroz slova' })).toHaveAttribute('aria-valuenow', '15');
    const stage = screen.getByRole('region', { name: 'Zadatak sa slovom M' });
    const listenButton = screen.getByRole('button', { name: 'Poslušaj slovo M' });
    expect(listenButton).toBeVisible();
    expect(screen.getByRole('group', { name: 'Kontrole zadatka' })).toContainElement(listenButton);
    expect(stage.querySelector('.letter-match-focus')).not.toContainElement(listenButton);
    expect(screen.queryByRole('img', { name: 'Sovica' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Medved/i }).querySelector('img')).toHaveAttribute('src', '/images/words/bear.svg');
    expect(screen.getByRole('button', { name: /Ovan/i }).querySelector('img')).toHaveAttribute('src', '/images/words/sheep.svg');
    expect(screen.getByRole('button', { name: /Tigar/i }).querySelector('img')).toHaveAttribute('src', '/images/words/tiger.svg');

    fireEvent.click(screen.getByRole('button', { name: /Ovan/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Skoro!');
    expect(screen.getByRole('button', { name: /Ovan/i })).toHaveClass('answer-retry');

    fireEvent.click(screen.getByRole('button', { name: /Medved/i }));
    expect(screen.getByRole('progressbar', { name: 'Napredak kroz slova' })).toHaveAttribute('aria-valuenow', '16');
    expect(screen.getByRole('status')).toHaveTextContent(/Bravo!.*Sledeće je/);
  });

  it('vraća staru igru sa balonima u novi ilustrovani centar igara', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Baloni' }));
    const target = screen.getByLabelText(/Traženo slovo/).textContent;
    expect(screen.getByRole('heading', { name: new RegExp(`Pronađi slovo ${target}`) })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: `Balon sa slovom ${target}` }));
    expect(screen.getByText(/Baloni tačno pogođeni: 1/)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Bravo!');
  });

  it('menja mesto tačnog odgovora u slikama, pogađanju glasa i balonima', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));

    const matchPositions: number[] = [];
    let startingGameIndex = -1;
    for (let round = 0; round < 3; round += 1) {
      const stage = screen.getByRole('region', { name: /Zadatak sa slovom/ });
      const targetLetter = stage.querySelector('.letter-match-prompt strong')!.textContent!.toUpperCase();
      const targetIndex = letters.findIndex((letter, index) => letter.upper === targetLetter || LATIN_ALPHABET[index].toUpperCase() === targetLetter);
      expect(targetIndex).toBeGreaterThanOrEqual(0);
      if (round === 0) startingGameIndex = targetIndex;
      const targetWord = transliterate(letters[targetIndex].words[0].word).toLocaleLowerCase();
      const choices = Array.from(document.querySelectorAll<HTMLButtonElement>('.answer-grid button'));
      const correctIndex = choices.findIndex((button) => transliterate(button.textContent ?? '').toLocaleLowerCase().includes(targetWord));
      expect(correctIndex, `tačno: ${targetWord}; ponuđeno: ${choices.map((button) => button.textContent).join(' | ')}`).toBeGreaterThanOrEqual(0);
      matchPositions.push(correctIndex);
      fireEvent.click(choices[correctIndex]);
    }
    expect(new Set(matchPositions)).toEqual(new Set([0, 1, 2]));

    fireEvent.click(screen.getByRole('button', { name: 'Pogodi glas' }));
    const listenPositions: number[] = [];
    for (let round = 0; round < 3; round += 1) {
      const targetLetter = transliterate(letters[(startingGameIndex + 3 + round) % letters.length].upper).toUpperCase();
      const choices = Array.from(document.querySelectorAll<HTMLButtonElement>('.quiz-choices button'));
      const correctIndex = choices.findIndex((button) => transliterate(button.textContent ?? '').toUpperCase() === targetLetter);
      expect(correctIndex).toBeGreaterThanOrEqual(0);
      listenPositions.push(correctIndex);
      fireEvent.click(choices[correctIndex]);
    }
    expect(new Set(listenPositions)).toEqual(new Set([0, 1, 2]));

    fireEvent.click(screen.getByRole('button', { name: 'Baloni' }));
    const balloonPositions: number[] = [];
    for (let round = 0; round < 3; round += 1) {
      const targetLetter = screen.getByLabelText(/Traženo slovo/).textContent!;
      const choices = Array.from(document.querySelectorAll<HTMLButtonElement>('.balloon-grid button'));
      const correctIndex = choices.findIndex((button) => button.getAttribute('aria-label') === `Balon sa slovom ${targetLetter}`);
      expect(correctIndex).toBeGreaterThanOrEqual(0);
      balloonPositions.push(correctIndex);
      fireEvent.click(choices[correctIndex]);
    }
    expect(new Set(balloonPositions)).toEqual(new Set([0, 1, 2]));
  });

  it('premium funkcije i dalje prolaze kroz roditeljsku proveru kada je trgovina uključena', () => {
    enableIosCommerce();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Dnevni izazov/i }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Današnja avantura' })).not.toBeInTheDocument();
  });

  it('otvara mapu od 36 progresivnih nivoa i ne preskače zaključan nivo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cela mapa' }));

    expect(screen.getByText('Sovicina škola pisanja')).toBeVisible();
    const first = screen.getByRole('button', { name: /Nivo 1: Prvo slovo/i });
    const second = screen.getByRole('button', { name: /Nivo 2: Moja prva reč, zaključano/i });
    expect(first).toBeEnabled();
    expect(second).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Nivo \d+:/i })).toHaveLength(36);
  });

  it('otključava sledeći nivo tek kada je prethodni stvarno završen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cela mapa' }));
    useProgressStore.getState().completeLearningPath('voice-1');

    await waitFor(() => expect(
      screen.getByRole('button', { name: /Nivo 2: Moja prva reč/i })
    ).toBeEnabled());
  });

  it('prikazuje stvarni progresivni logički zadatak sa jasnim objašnjenjem', async () => {
    const levels = adventureWorlds.flatMap((world) => world.levels);
    levels.slice(0, 18).forEach((level) => useProgressStore.getState().completeLearningPath(level.id));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cela mapa' }));
    fireEvent.click(screen.getByRole('button', { name: /Nivo 19: Sabiranje slikama/i }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    expect(await screen.findByText(/Dve i jedna su tri/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nastavi avanturu' })).toBeEnabled();
  });

  it('otvara školu slova i prikazuje reči u izabranom pismu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));
    expect(screen.getByRole('button', { name: 'Odaberi sliku: Avion' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Slušaj ponovo/i })).toBeVisible();
  });

  it('prikazuje animiranu ilustraciju povezanu sa slovom u novoj lekciji', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));

    const animation = screen.getByTestId('letter-animation');
    expect(animation).toHaveAccessibleName('Avion poleće preko neba');
    expect(animation).toHaveClass('motion-fly');
    expect(animation).toHaveTextContent('✈️');
  });

  it('napuštanje lekcije odmah zaustavlja prethodni glas', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));
    await waitFor(() => expect(play).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));

    expect(pause).toHaveBeenCalled();
  });

  it('prebacuje kompletan meni, naslove i oznake između latinice i ćirilice', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Nauči slova/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('button', { name: /Pismo.*Latinica/i }));

    await waitFor(() => expect(
      screen.getByRole('heading', { name: 'Подешавања за родитеље' })
    ).toBeVisible());
    expect(screen.getByRole('button', { name: /Писмо.*Ћирилица/i })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Словолов Премиум' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Енглески' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Немачки' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Француски' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByRole('button', { name: /Научи слова/i })).toBeVisible();
    expect(screen.queryByText('Nauči slova')).not.toBeInTheDocument();
  });

  it('zaključani sadržaj ne može da se zaobiđe iz liste slova ili brojeva', () => {
    enableIosCommerce();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'J j zaključano' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–10/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Piši broj' }));
    fireEvent.click(screen.getByRole('button', { name: 'Broj 11' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
  });

  it('tačna slika dodeljuje zvezdicu i automatski otvara sledeće slovo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));

    expect(screen.getByText('Pronađi sliku za reč Avion')).toBeVisible();
    expect(document.querySelector('.picture-game-owl')).toHaveAttribute('src', '/images/mascot-owl-v1.png');
    expect(screen.getByRole('button', { name: 'Poslušaj reč Avion' })).toBeVisible();
    expect(screen.getByText('Izaberi jednu sličicu')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Odaberi sliku: Avion' }));

    expect(useProgressStore.getState().profile.stars).toBe(1);
    expect(screen.getByRole('heading', { name: 'Slovo B b' })).toBeVisible();
  });

  it('lekcija prikazuje samo jedan izmešan skup od tri različite slike', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));

    const choices = screen.getAllByRole('button', { name: /Odaberi sliku:/i });
    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((choice) => choice.getAttribute('aria-label'))).size).toBe(3);
    expect(choices[0]).not.toHaveAccessibleName('Odaberi sliku: Avion');
  });

  it('ekran pisanja ima platno, paletu boja i izbor debljine olovke', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Piši slova/i }));
    expect(screen.getByLabelText(/platno za pisanje/i)).toBeVisible();
    expect(screen.getByTestId('practice-screen')).toHaveClass('single-screen');
    expect(screen.getByRole('group', { name: 'Boja olovke' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Debljina olovke' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Boja Ljubičasta' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Srednja' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Boja Crvena' }));
    fireEvent.click(screen.getByRole('button', { name: 'Debela' }));
    expect(screen.getByRole('button', { name: 'Boja Crvena' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Debela' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pisanje koristi različit stvarni oblik i vodič za veliko i malo slovo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Piši slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Malo slovo' }));

    expect(screen.getByLabelText('Platno za pisanje slova a')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Pišemo a' })).toBeVisible();
    expect(screen.getByTestId('guide-letter')).toHaveTextContent('a');
    expect(screen.getByTestId('guide-letter')).toHaveClass('guide-letter-lowercase');
    expect(screen.queryByTestId('vector-trace-guide')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Veliko slovo' }));
    expect(screen.getByRole('heading', { name: 'Pišemo A' })).toBeVisible();
    expect(screen.getByTestId('guide-letter')).toHaveTextContent('A');
    expect(screen.queryByTestId('vector-trace-guide')).not.toBeInTheDocument();
  });

  it('otvara brojeve od nule do sto i u učenju ne otkriva broj pre odgovora', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));

    expect(screen.getByRole('heading', { name: 'Brojevi 0–100' })).toBeVisible();
    expect(screen.queryByText('1', { selector: '.big-number strong' })).not.toBeInTheDocument();
    expect(screen.getByText('Koliko sličica vidiš?')).toBeVisible();
    expect(screen.getAllByTestId('counting-picture')).toHaveLength(1);
    await waitFor(() => expect(play).toHaveBeenCalled());
    expect((play.mock.instances.at(-1) as HTMLAudioElement).src)
      .toContain('/audio/feedback/number-question.mp3');
  });

  it('brojeve može da vežba pisanjem na istom ekranu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Piši broj' }));
    expect(screen.getByRole('button', { name: 'Broj 100' })).toBeVisible();
    expect(screen.getByLabelText('Platno za pisanje slova 1')).toBeVisible();
  });

  it('tačan broj dodeljuje zvezdicu i automatski prelazi na sledeći broj', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Odgovor 1' }));

    expect(useProgressStore.getState().profile.learnedNumbers).toContain(1);
    expect(useProgressStore.getState().profile.stars).toBe(1);
    await waitFor(() => expect(screen.getAllByTestId('counting-picture')).toHaveLength(2), {
      timeout: 5_500
    });
    expect(screen.getByText('Koliko sličica vidiš?')).toBeVisible();
  }, 7_000);

  it('kviz izgovara naziv slike, ne otkriva reč i nudi početna slova', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Kviz/i }));

    expect(screen.getByText('Poslušaj i pogodi početno slovo.')).toBeVisible();
    const image = screen.getByRole('img', { name: 'Slika za kviz pitanje' });
    const current = quizQuestions.find((question) => question.emoji === image.textContent);
    expect(current).toBeDefined();
    expect(screen.queryByText(convertInterfaceText(current!.word, 'latin'))).not.toBeInTheDocument();
    expect(document.querySelectorAll('.quiz-choices button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Poslušaj naziv slike ponovo' })).toBeVisible();

    await waitFor(() => expect(play).toHaveBeenCalled());
    expect((play.mock.instances.at(-1) as HTMLAudioElement).src).toContain(current!.audioSource);

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    (play.mock.instances.at(-1) as HTMLAudioElement).dispatchEvent(new Event('ended'));
    await waitFor(() => expect(screen.getByRole('button', {
      name: 'Poslušaj naziv slike ponovo'
    })).toBeEnabled());
    play.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Poslušaj naziv slike ponovo' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
  });

  it('kviz i igra koriste lokalni srpski zvuk za tačan odgovor', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));
    fireEvent.click(screen.getByRole('button', { name: /Medved/i }));

    await waitFor(() => expect(play).toHaveBeenCalled());
    expect((play.mock.instances.at(-1) as HTMLAudioElement).src)
      .toContain('/audio/feedback/bravo-correct.mp3');

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    play.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Kviz/i }));
    const image = screen.getByRole('img', { name: 'Slika za kviz pitanje' });
    const current = quizQuestions.find((question) => question.emoji === image.textContent)!;
    await waitFor(() => expect(play).toHaveBeenCalled());
    play.mockClear();
    fireEvent.click(screen.getByRole('button', {
      name: LATIN_ALPHABET[current.letterIndex].toLocaleUpperCase('sr-Latn')
    }));

    await waitFor(() => expect(play).toHaveBeenCalled());
    expect((play.mock.instances.at(-1) as HTMLAudioElement).src)
      .toContain('/audio/feedback/bravo-correct.mp3');
  });

  it('kviz prelazi dalje tek kada se završi lokalni Bravo snimak', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Kviz/i }));
    const image = screen.getByRole('img', { name: 'Slika za kviz pitanje' });
    const current = quizQuestions.find((question) => question.emoji === image.textContent)!;
    await waitFor(() => expect(play).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', {
      name: LATIN_ALPHABET[current.letterIndex].toLocaleUpperCase('sr-Latn')
    }));
    await waitFor(() => expect((play.mock.instances.at(-1) as HTMLAudioElement).src)
      .toContain('/audio/feedback/bravo-correct.mp3'));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(screen.getByText('Kviz 1/10')).toBeVisible();
    (play.mock.instances.at(-1) as HTMLAudioElement).dispatchEvent(new Event('ended'));

    await waitFor(() => expect(screen.getByText('Kviz 2/10')).toBeVisible());
  });

  it('kviz poruku ne prosleđuje TalkBack ili VoiceOver glasu telefona', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Kviz/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Poslušaj naziv slike i izaberi početno slovo.'))
      .toHaveAttribute('aria-live', 'off');
  });

  it('brojevi imaju stvarno računanje prilagođeno deci', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Računanje' }));

    expect(screen.getByText('Koliko je 2 + 1?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByRole('status')).toHaveTextContent('Tačno');
  });

  it('čitanje ima slogove, reči i priču sa nagradnim pitanjem', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));

    expect(screen.getByRole('button', { name: 'Slogovi' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reči' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Priča' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Glasovi i rime' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Priča' }));
    expect(screen.getByText(/Priča 1\/20/)).toBeVisible();
    await waitFor(() => expect(screen.getByText(/Šta pronalazi/)).toBeVisible());
  });

  it('slogovi imaju više primera i svaki klik pokreće lokalni Sophie snimak', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));

    fireEvent.click(screen.getByRole('button', { name: /MA/i }));

    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/reading/syllable-ma.mp3')
    )).toBe(true));
    expect(screen.getByRole('button', { name: /Sledeći slogovi/i })).toBeVisible();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
  });

  it('reči prikazuju odgovarajuću sliku i izgovaraju samo izabranu reč', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Reči' }));

    fireEvent.click(screen.getByRole('button', { name: /🦉.*СОВА/i }));

    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/reading/word-sova.mp3')
    )).toBe(true));
    expect(screen.queryByText(/roditelj može da uključi/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sledeće reči/i })).toBeVisible();
  });

  it('dugme Pročitaj rečenicu koristi stvarni snimak izabrane priče', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Priča' }));
    fireEvent.click(screen.getByRole('button', { name: /Pročitaj rečenicu/i }));

    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/reading/stories/')
    )).toBe(true));
  });

  it('prvi svet avanture koristi pisanje i Sophie naratora bez dečjeg snimanja', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cela mapa' }));
    fireEvent.click(screen.getByRole('button', { name: /Nivo 1:/i }));

    expect(screen.getByRole('heading', { name: /Piši sa Sovicom/i })).toBeVisible();
    expect(screen.queryByText(/snimi svoj glas/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Upiši slovo/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Poslušaj Sovicu/i })).toBeVisible();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'off');
    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/reading/adventure/literacy-1.mp3')
    )).toBe(true));
  });

  it('avantura posle tačnog pisanja pušta postojeći Sophie Bravo snimak', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Cela mapa' }));
    fireEvent.click(screen.getByRole('button', { name: /Nivo 1:/i }));

    fireEvent.change(screen.getByLabelText(/Upiši slovo/i), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /Proveri/i }));

    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/feedback/bravo-correct.mp3')
    )).toBe(true));
    expect(screen.getByRole('status')).toHaveTextContent(/Bravo/i);
  });

  it('priče se biraju prema uzrastu deteta', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Priča' }));
    expect(screen.getByRole('button', { name: 'Uzrast 4–6' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Uzrast 8–10' }));
    expect(screen.getByText(/Priča 1\/20/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sledeća priča' })).toBeVisible();
  });

  it('otvara audio knjigu, pamti stranicu i ne prikazuje pitanje pre kraja', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    expect(screen.getByRole('heading', { name: 'Bajke i priče' })).toBeVisible();
    expect(screen.getByText('Bajka 1/37')).toBeVisible();
    expect(screen.getByText(/Strana 1\//)).toBeVisible();
    expect(screen.queryByText('Kako su Ivica i Marica prvi put obeležili put?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slušaj celu priču' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pauza' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Čitaj zajedno' }));
    const sentence = screen.getAllByRole('button', { name: /Rečenica/i })[0];
    fireEvent.click(sentence);
    const activeStory = screen.getByTestId('fairy-tale').getAttribute('data-story-id');
    expect(useProgressStore.getState().profile.storyBookmarks[activeStory ?? '']).toBe(0);
  });

  it('audio knjiga nikada ne obećava glas telefona kao rezervu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    expect(screen.queryByText(/glas uređaja/i)).not.toBeInTheDocument();
    expect(screen.getByText(/snimljeni srpski narator/i)).toBeVisible();
  });

  it('prikazuje bajku kao pristupačnu fullscreen slikovnicu za decu', async () => {
    stubFirstFullStory();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    const reader = screen.getByTestId('storybook-reader');
    expect(reader).toHaveAttribute('data-reader-mode', 'immersive');
    expect(screen.getByRole('img', { name: 'Ilustracija za Princeza na zrnu graška' })).toBeVisible();
    await waitFor(() => expect(screen.getByText(`Cela bajka · ${firstFullStory.wordCount} reči`)).toBeVisible());
    expect(screen.getByRole('progressbar', { name: 'Napredak kroz bajku' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.queryByRole('article', { name: 'Tekst priče' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Čitaj zajedno' }));
    expect(screen.getByRole('article', { name: 'Tekst priče' })).toBeVisible();
    expect(screen.getByText(/Snimljeni srpski narator/i)).toBeVisible();
    await waitFor(() => expect(
      screen.getByRole('button', { name: '⬇ Preuzmi celu bajku za offline' })
    ).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Uvećaj tekst' }));
    expect(screen.getByRole('article', { name: 'Tekst priče' })).toHaveClass('large-text');
  });

  it('prikazuje autora, izvor i licencu celog srpskog izdanja', async () => {
    stubFirstFullStory();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    expect(screen.getByLabelText('Izvor bajke: Hans Kristijan Andersen')).toBeVisible();
    await waitFor(() => expect(screen.getByText(/Srpski Wikizvornik · CC BY-SA 4.0/i)).toBeVisible());
    expect(screen.getByRole('link', { name: 'Otvori tačno izvorno izdanje' }))
      .toHaveAttribute('href', firstFullStory.source.url);
  });

  it('celu bajku učitava tek kada dete otvori naslov koji je ima', async () => {
    const request = stubFirstFullStory();
    render(<App />);
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));
    await waitFor(() => expect(screen.getByText(`Cela bajka · ${firstFullStory.wordCount} reči`)).toBeVisible());
    expect(request).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Čitaj zajedno' }));
    expect(screen.getByText(firstFullStory.pages[0][0])).toBeVisible();
  });

  it('ne prikazuje lažno aktivno slušanje kada je zvuk isključen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('checkbox', { name: /Zvuk/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Slušaj celu priču' }));

    expect(screen.getByRole('status')).toHaveTextContent('Uključi zvuk');
    expect(screen.getByRole('button', { name: 'Pauza' })).toBeDisabled();
  });

  it('pitanje se otključava na poslednjoj strani i dodeljuje zvezdicu samo jednom', async () => {
    stubFirstFullStory();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));
    await waitFor(() => expect(screen.getByText(`Cela bajka · ${firstFullStory.wordCount} reči`)).toBeVisible());
    for (let page = 1; page < firstFullStory.pages.length; page += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Sledeća stranica' }));
    }
    await waitFor(() => expect(screen.getByText('Koju si priču upravo slušao?')).toBeVisible());
    const answer = convertInterfaceText(firstFullStory.title, 'latin');
    fireEvent.click(screen.getByRole('button', { name: answer }));
    fireEvent.click(screen.getByRole('button', { name: answer }));
    expect(useProgressStore.getState().profile.stars).toBe(1);
    expect(screen.getByRole('status')).toHaveTextContent('Bravo');
  });

  it('memory igra stvarno otvara i spaja par slova i slika', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }));
    fireEvent.click(screen.getByRole('button', { name: 'Otvori memory karticu 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Otvori memory karticu 4' }));
    expect(screen.getByRole('status')).toHaveTextContent('Pronađen par');
  });

  it('dnevni izazov prikazuje tri kratka zadatka i nagradu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Dnevni izazov/i }));
    expect(screen.getByRole('heading', { name: 'Današnja avantura' })).toBeVisible();
    expect(screen.getAllByText(/Korak/)).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Otvorena škrinja sa zvezdicama' })).toBeVisible();
    expect(screen.getByLabelText(/od 3 zadatka završeno; nagrada je škrinja/)).toBeVisible();
  });

  it('dnevni izazov zadržava rimu, postepeno otključava logiku i pušta lokalnog naratora', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const dateKey = new Date().toISOString().slice(0, 10);
    const daySeed = Array.from(dateKey).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const rhyme = rhymeRounds[daySeed % rhymeRounds.length];
    const logic = logicChallenges[(daySeed + 2) % logicChallenges.length];
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Dnevni izazov/i }));
    expect(screen.getByText(/Koja reč se rimuje sa/i)).toBeVisible();
    expect(screen.getByText(logic.prompt)).toBeVisible();
    expect(screen.getAllByText(/Prvo reši prethodni zadatak/i)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: convertInterfaceText(rhyme.correct, 'latin') }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Poslušaj zadatak 2' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Poslušaj zadatak 2' }));
    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLAudioElement).src.includes(`/audio/reading/daily/logic-${logic.id}.mp3`)
    )).toBe(true));
  });

  it('otvara adaptivnu lekciju i prikazuje stvarno preporučeno slovo', () => {
    useProgressStore.getState().recordSkillAttempt('letter:А', false);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Moja lekcija/i }));

    expect(screen.getByRole('heading', { name: 'Moja pametna lekcija' })).toBeVisible();
    expect(screen.getByText(/Danas ponavljamo slovo A/i)).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Napredak moje lekcije' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('region', { name: 'Pitanje 1: Koje slovo čuješ?' })).toHaveTextContent('Odgovor:');
    expect(screen.getByRole('region', { name: 'Pitanje 2: Pronađi sliku' })).toHaveTextContent('Odgovor:');
    expect(screen.getByRole('region', { name: 'Pitanje 3: Dopuni slog' })).toHaveTextContent('Odgovor:');
  });

  it('moja lekcija ne dodeljuje zvezdice bez tri tačna odgovora', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja lekcija/i }));
    const initialStars = useProgressStore.getState().profile.stars;
    const first = within(screen.getByRole('region', { name: 'Pitanje 1: Koje slovo čuješ?' }));
    const wrong = first.getAllByRole('button').find((button) => button.textContent !== 'A' && !button.hasAttribute('aria-label'))!;
    fireEvent.click(wrong);
    expect(screen.getByRole('progressbar', { name: 'Napredak moje lekcije' })).toHaveAttribute('aria-valuenow', '0');
    expect(useProgressStore.getState().profile.stars).toBe(initialStars);

    fireEvent.click(first.getByRole('button', { name: 'A' }));
    const picture = within(screen.getByRole('region', { name: 'Pitanje 2: Pronađi sliku' }));
    fireEvent.click(picture.getByRole('button', { name: 'Slika: Avion' }));
    expect(useProgressStore.getState().profile.stars).toBe(initialStars);
    const syllable = within(screen.getByRole('region', { name: 'Pitanje 3: Dopuni slog' }));
    fireEvent.click(syllable.getByRole('button', { name: 'A' }));
    expect(screen.getByRole('progressbar', { name: 'Napredak moje lekcije' })).toHaveAttribute('aria-valuenow', '3');
    expect(useProgressStore.getState().profile.stars).toBe(initialStars + 3);
  });

  it('igre sadrže slušni zadatak i slaganje reči', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));

    expect(screen.getByRole('button', { name: 'Pogodi glas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Složi reč' })).toBeVisible();
  });

  it('slaganje reči ima veliki fond i nastavlja posle prvih pet zadataka', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Složi reč' }));

    const solveCurrentWord = () => {
      const target = screen.getByRole('heading', { name: /Složi reč/ }).textContent!.replace('Složi reč ', '');
      for (const letter of target) {
        const tile = screen.getAllByRole('button', { name: /Dodaj slovo/ })
          .find((button) => button.textContent === letter && !button.hasAttribute('disabled'));
        expect(tile, `treba da postoji pločica za slovo ${letter}`).toBeDefined();
        fireEvent.click(tile!);
      }
    };

    expect(screen.getByRole('progressbar', { name: 'Napredak u slaganju reči' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('progressbar', { name: 'Napredak u slaganju reči' })).toHaveAttribute('aria-valuemax', '32');
    solveCurrentWord();
    expect(screen.getByRole('status')).toHaveTextContent('Bravo! Složio si reč МАМА!');
    fireEvent.click(screen.getByRole('button', { name: 'Sledeća reč' }));

    expect(screen.getByRole('heading', { name: 'Složi reč МЕД' })).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Napredak u slaganju reči' })).toHaveAttribute('aria-valuenow', '2');
    solveCurrentWord();
    expect(screen.getByRole('status')).toHaveTextContent('Bravo! Složio si reč МЕД!');

    for (let wordNumber = 3; wordNumber <= 6; wordNumber += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Sledeća reč' }));
      expect(screen.getByRole('progressbar', { name: 'Napredak u slaganju reči' }))
        .toHaveAttribute('aria-valuenow', String(wordNumber));
      solveCurrentWord();
      expect(screen.getByRole('status')).toHaveTextContent('Bravo! Složio si reč');
    }

  }, 20000);

  it('kreativna radionica pravi i lokalno čuva punu detetovu priču', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja priča/i }));

    expect(screen.getByText('Početak')).toBeVisible();
    expect(screen.getByText('Izazov')).toBeVisible();
    expect(screen.getByText('Rešenje')).toBeVisible();
    expect(screen.getByText('Srećan kraj')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Sačuvaj moju priču/i }));

    expect(useProgressStore.getState().profile.savedCreations).toHaveLength(1);
    expect(useProgressStore.getState().profile.savedCreations[0].length).toBeGreaterThan(500);
    expect(screen.getByRole('status')).toHaveTextContent('sačuvana');
  });

  it('Moju knjigu čita samo postojeći snimljeni narator', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.mocked(window.speechSynthesis.speak).mockClear();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja priča/i }));

    fireEvent.click(screen.getByRole('button', { name: /Slušaj moju priču/i }));

    await waitFor(() => expect(play.mock.instances.some(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/creative/')
    )).toBe(true));
    const narratorAudio = play.mock.instances.find(
      (instance) => (instance as HTMLMediaElement).src.includes('/audio/creative/')
    ) as HTMLMediaElement;
    expect(narratorAudio.src)
      .toContain('/audio/creative/opening-h1-p1.mp3');
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(screen.getByText(/postojeći provereni srpski narator Sophie/i)).toBeVisible();
  });

  it('roditeljske kontrole su iza jednostavne roditeljske provere', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));

    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: /Zvuk/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Koliko je 4 + 3?'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Otvori roditeljski deo' }));
    expect(screen.getByRole('checkbox', { name: /Zvuk/i })).toBeVisible();
  });

  it('jezik pomoći roditelju stvarno menja prikaz objašnjenja', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.change(screen.getByRole('combobox', { name: 'Jezik pomoći roditelju' }), { target: { value: 'de' } });

    expect(screen.getByText(/Kinderinhalte bleiben auf Serbisch/i)).toBeVisible();
  });

  it('kupovina je samo u roditeljskom delu i web ne prikazuje lažan uspeh', async () => {
    enableIosCommerce();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByRole('heading', { name: 'Slovolov Premium' })).toBeVisible();
    expect(screen.getByText(/mesečna pretplata se automatski obnavlja/i)).toBeVisible();
    expect(screen.getByText('Cela azbuka')).toBeVisible();
    expect(screen.getByText('Igre i učenje')).toBeVisible();
    expect(screen.getByText('Za celu porodicu')).toBeVisible();
    expect(screen.getByText(/Svih 30 slova i brojevi 0–100/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Vrati kupovinu/i })).toBeDisabled();
    await waitFor(() => expect(screen.getByText(/Premium je trenutno dostupan samo u iOS aplikaciji/i)).toBeVisible());
  });

  it('potvrđena pretplata prikazuje Premium kao aktivan za sve profile', () => {
    useProgressStore.getState().grantFamilyAccess('store');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByText('Pretplata je aktivna')).toBeVisible();
    expect(screen.getByText(/dostupan svim profilima/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Otključaj celu aplikaciju/i })).not.toBeInTheDocument();
  });

  it('roditelj bira i trajno čuva težinu zadataka', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Izazovno' }));
    expect(useProgressStore.getState().profile.difficulty).toBe('challenge');
  });

  it('bojanka nudi predmete umesto slova i čestita sa nazivom obojenog predmeta', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bojanka/i }));
    expect(screen.getByText('Predmet 1 od 30')).toBeVisible();
    expect(screen.getByLabelText(/Bojanka za/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gumica/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Gotovo, obojio sam/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Gotovo, obojio sam/i }));
    expect(screen.getByText(/Prvo oboji deo slike/)).toBeVisible();
    const canvas = screen.getByLabelText(/Bojanka za/);
    Object.defineProperty(canvas, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 260, height: 420 }) });
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 120, clientY: 120 });
    fireEvent.click(screen.getByRole('button', { name: /Gotovo, obojio sam/i }));
    expect(screen.getByText(/Bravo! Obojao si avion\. Reč: AVION\./i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Sledeći predmet' }));
    expect(screen.getByText(/Predmet\s+2\s+od\s+30/)).toBeVisible();
  });

  it('svih 30 predmeta bojanke koristi postojeću tablu ili provereni zaseban crtež', () => {
    const sources: string[] = [];
    vi.stubGlobal('Image', class {
      naturalWidth = 1536;
      naturalHeight = 1024;
      onload: (() => void) | null = null;
      set src(value: string) { sources.push(value); this.onload?.(); }
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bojanka/i }));
    const expected = new Map([
      [0, '/images/coloring/airplane-coloring-v1.png'],
      [1, '/images/coloring/balloon-coloring-v1.svg'],
      [6, '/images/coloring/ekser-coloring-v1.svg'],
      [11, '/images/coloring/whale-coloring-v1.svg'],
      [22, '/images/coloring/rug-coloring-v1.svg'],
      [25, '/images/coloring/bread-coloring-v1.svg']
    ]);
    for (let index = 0; index < 30; index += 1) {
      if (index > 0) fireEvent.click(screen.getByRole('button', { name: 'Sledeći predmet' }));
      const path = expected.get(index) ?? `/images/coloring/objects-sheet-${Math.floor(index / 6) + 1}-v1.png`;
      expect(sources.at(-1)).toBe(path);
      expect(readFileSync(resolve(process.cwd(), `public${path}`)).byteLength).toBeGreaterThan(100);
    }
  });

  it('roditelj unosi ime novog profila i kasnije ga menja', async () => {
    useProgressStore.getState().grantFamilyAccess('store');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('button', { name: /Dodaj profil/i }));

    fireEvent.change(screen.getByLabelText('Ime deteta'), { target: { value: 'Лука' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj profil' }));
    await waitFor(() => expect(screen.getByText('Luka')).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Promeni ime za Luka' }));
    fireEvent.change(screen.getByLabelText('Novo ime deteta'), { target: { value: 'Лазар' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj ime' }));
    await waitFor(() => expect(screen.getByText('Lazar')).toBeVisible());
    expect(screen.queryByText('Luka')).not.toBeInTheDocument();
  });
});
