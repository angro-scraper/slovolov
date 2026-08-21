import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { App } from './App';
import { quizQuestions } from './data/quizQuestions';
import { LATIN_ALPHABET } from './domain/letters';
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
  });

  it('otvara mapu od 30 progresivnih nivoa i ne preskače zaključan nivo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));

    expect(screen.getByText('Sovicina škola pisanja')).toBeVisible();
    const first = screen.getByRole('button', { name: /Nivo 1: Prvo slovo$/i });
    const second = screen.getByRole('button', { name: /Nivo 2: Moja prva reč, zaključano/i });
    expect(first).toBeEnabled();
    expect(second).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Nivo \d+:/i })).toHaveLength(36);
  });

  it('ne prikazuje uklonjenu igru skupljanja na mapi avanture', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));

    expect(screen.queryByText('IGRA SKUPLJANJA')).not.toBeInTheDocument();
    expect(screen.queryByText(/Vodi Sovicu kroz staze/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Šuma slova/i })).not.toBeInTheDocument();
  });

  it('otključava sledeći nivo tek kada je prethodni stvarno završen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));
    useProgressStore.getState().completeLearningPath('voice-1');

    await waitFor(() => expect(
      screen.getByRole('button', { name: /Nivo 2: Moja prva reč$/i })
    ).toBeEnabled());
  });

  it('prikazuje stvarni progresivni logički zadatak sa jasnim objašnjenjem', async () => {
    const levels = adventureWorlds.flatMap((world) => world.levels);
    levels.slice(0, 18).forEach((level) => useProgressStore.getState().completeLearningPath(level.id));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nivo 19: Sabiranje slikama$/i }));
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

  it('u iOS izdanju zaključava sadržaj van ograničenog demo paketa', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ž ž zaključano' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–100/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Piši broj' }));
    fireEvent.click(screen.getByRole('button', { name: 'Broj 11' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Sledeća bajka' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sledeća bajka' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sledeća bajka' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
  });

  it('napredni iOS moduli ne rade besplatno bez pokretanja Apple probe', () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Igre.*Premium/i }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
  });

  it('tačna slika dodeljuje zvezdicu i automatski otvara sledeće slovo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'A a' }));

    expect(screen.getByText('Pronađi sliku za reč Avion')).toBeVisible();
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

  it('ekran pisanja ima platno, pomoćne linije i ne zahteva skrolovanje komandi', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Piši slova/i }));
    expect(screen.getByLabelText(/platno za pisanje/i)).toBeVisible();
    expect(screen.getByTestId('practice-screen')).toHaveClass('single-screen');
  });

  it('pisanje podržava veliko i malo slovo sa jednim svetlim vodičem', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Piši slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Malo slovo' }));

    expect(screen.getByLabelText('Platno za pisanje slova a')).toBeVisible();
    expect(screen.getByTestId('guide-letter')).toHaveTextContent('a');
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
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /Moja avantura/i }));
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
  });

  it('otvara adaptivnu lekciju i prikazuje stvarno preporučeno slovo', () => {
    useProgressStore.getState().recordSkillAttempt('letter:А', false);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Moja lekcija/i }));

    expect(screen.getByRole('heading', { name: 'Moja pametna lekcija' })).toBeVisible();
    expect(screen.getByText(/Danas ponavljamo slovo A/i)).toBeVisible();
    expect(screen.getByText(/3 kratka koraka/i)).toBeVisible();
  });

  it('igre sadrže slušni zadatak i slaganje reči', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));

    expect(screen.getByRole('button', { name: 'Pogodi glas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Složi reč' })).toBeVisible();
  });

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
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    vi.stubEnv('VITE_IOS_PREMIUM_ENABLED', 'true');
    vi.stubGlobal('CdvPurchase', undefined);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByRole('heading', { name: 'Slovolov Premium' })).toBeVisible();
    expect(screen.queryByText(/3,99 € mesečno/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/prvih 7 dana besplatno/i)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ponuda nije učitana/i })).toBeDisabled(),
    );
    expect(screen.getByRole('button', { name: /Ponovi proveru ponude/i })).toBeEnabled();
    const subscriptionDisclosure = screen.getByText(/auto-obnovljiva mesečna pretplata/i).parentElement;
    expect(subscriptionDisclosure).toBeVisible();
    expect(subscriptionDisclosure).toHaveTextContent(/pretplata se automatski obnavlja svakog meseca preko Apple-a/i);
    expect(subscriptionDisclosure).toHaveTextContent(/najmanje 24 sata pre kraja tekućeg perioda/i);
    expect(screen.getByText(/Bez reklama/i)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Uslovi korišćenja' })).toHaveAttribute('href', 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
    expect(screen.getAllByRole('link', { name: 'Politika privatnosti' }).find((link) => link.getAttribute('href') === 'https://slovolov-download.onrender.com/privacy.html')).toBeDefined();
    await waitFor(() => expect(screen.getByText(/trenutno dostupan samo u iOS aplikaciji/i)).toBeVisible());
    expect(screen.getByRole('button', { name: /Vrati kupovinu/i })).toBeEnabled();
  });

  it('potvrđena Premium pretplata otključava biblioteku priča bez lažnog trajnog prava', () => {
    useProgressStore.getState().grantFamilyAccess('store');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByText(/Celokupan Premium sadržaj je aktivan/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Pokreni 7 dana besplatno/i })).not.toBeInTheDocument();
  });

  it('roditelj bira i trajno čuva težinu zadataka', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Izazovno' }));
    expect(useProgressStore.getState().profile.difficulty).toBe('challenge');
  });

  it('bojanka ima paletu, gumicu i lokalno čuvanje', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bojanka/i }));
    expect(screen.getByLabelText(/Bojanka za slovo/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Gumica/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Sačuvaj crtež/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Sačuvaj crtež/i }));
    expect(screen.getByText(/Crtež za A je sačuvan/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Bojanka B' })).toBeVisible();
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
