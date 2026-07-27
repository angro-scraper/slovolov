import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { clearFullStoryCache } from './services/fullStoryLibrary';
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
  });

  it('otvara školu slova i prikazuje ćirilične reči', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'А а' }));
    expect(screen.getByRole('button', { name: 'Odaberi sliku: Авион' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Slušaj ponovo/i })).toBeVisible();
  });

  it('zaključani sadržaj ne može da se zaobiđe iz liste slova ili brojeva', () => {
    vi.stubEnv('VITE_COMMERCE_ENABLED', 'true');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ј ј zaključano' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Nazad' }));
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–10/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Broj 6' }));
    expect(screen.getByRole('heading', { name: 'Provera za roditelje' })).toBeVisible();
  });

  it('tačna slika dodeljuje zvezdicu i automatski otvara sledeće slovo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'А а' }));

    expect(screen.getByText('Pronađi sliku za reč Авион')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Odaberi sliku: Авион' }));

    expect(useProgressStore.getState().profile.stars).toBe(1);
    expect(screen.getByRole('heading', { name: 'Slovo Б б' })).toBeVisible();
  });

  it('lekcija prikazuje samo jedan izmešan skup od tri različite slike', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'А а' }));

    const choices = screen.getAllByRole('button', { name: /Odaberi sliku:/i });
    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((choice) => choice.getAttribute('aria-label'))).size).toBe(3);
    expect(choices[0]).not.toHaveAccessibleName('Odaberi sliku: Авион');
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

    expect(screen.getByLabelText('Platno za pisanje slova а')).toBeVisible();
    expect(screen.getByTestId('guide-letter')).toHaveTextContent('а');
  });

  it('otvara brojeve od nule do deset', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–10/i }));

    expect(screen.getByRole('button', { name: 'Broj 0' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Broj 10' })).toBeVisible();
    expect(screen.getByText('Koliko ima jabuka?')).toBeVisible();
  });

  it('brojeve može da vežba pisanjem na istom ekranu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–10/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Piši broj' }));
    expect(screen.getByLabelText('Platno za pisanje slova 1')).toBeVisible();
  });

  it('brojevi imaju stvarno računanje prilagođeno deci', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Brojevi 0–10/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Računanje' }));

    expect(screen.getByText('Koliko je 2 + 1?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByRole('status')).toHaveTextContent('Tačno');
  });

  it('čitanje ima slogove, reči i priču sa nagradnim pitanjem', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));

    expect(screen.getByRole('button', { name: 'Slogovi' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reči' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Priča' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Glasovi i rime' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Priča' }));
    expect(screen.getByText(/Priča 1\/20/)).toBeVisible();
    expect(screen.getByText(/Шта проналази/)).toBeVisible();
  });

  it('vežba izgovora ostaje zaključana dok roditelj ne dozvoli mikrofon', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Reči' }));

    expect(screen.getByText(/roditelj može da uključi/i)).toBeVisible();
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
    expect(screen.queryByText('Како су Ивица и Марица први пут обележили пут?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slušaj celu priču' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pauza' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Čitaj zajedno' }));
    const sentence = screen.getAllByRole('button', { name: /Rečenica/i })[0];
    fireEvent.click(sentence);
    const activeStory = screen.getByTestId('fairy-tale').getAttribute('data-story-id');
    expect(useProgressStore.getState().profile.storyBookmarks[activeStory ?? '']).toBe(0);
  });

  it('prikazuje bajku kao pristupačnu fullscreen slikovnicu za decu', async () => {
    stubFirstFullStory();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    const reader = screen.getByTestId('storybook-reader');
    expect(reader).toHaveAttribute('data-reader-mode', 'immersive');
    expect(screen.getByRole('img', { name: 'Ilustracija za Принцеза на зрну грашка' })).toBeVisible();
    await waitFor(() => expect(screen.getByText(`Cela bajka · ${firstFullStory.wordCount} reči`)).toBeVisible());
    expect(screen.getByRole('progressbar', { name: 'Napredak kroz bajku' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.queryByRole('article', { name: 'Tekst priče' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Čitaj zajedno' }));
    expect(screen.getByRole('article', { name: 'Tekst priče' })).toBeVisible();
    expect(screen.getByText(/Snimljeni glas ima prednost/i)).toBeVisible();
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

    expect(screen.getByLabelText('Izvor bajke: Ханс Кристијан Андерсен')).toBeVisible();
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
    expect(screen.getByText('Коју си причу управо слушао?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: firstFullStory.title }));
    fireEvent.click(screen.getByRole('button', { name: firstFullStory.title }));
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
    expect(screen.getByText(/Danas ponavljamo slovo А/i)).toBeVisible();
    expect(screen.getByText(/3 kratka koraka/i)).toBeVisible();
  });

  it('igre sadrže slušni zadatak i slaganje reči', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Igre/i }));

    expect(screen.getByRole('button', { name: 'Pogodi glas' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Složi reč' })).toBeVisible();
  });

  it('kreativna radionica pravi i lokalno čuva detetovu rečenicu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Moja priča/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sačuvaj moju priču/i }));

    expect(useProgressStore.getState().profile.savedCreations).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('sačuvana');
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

  it('kupovina je samo u roditeljskom delu i web ne prikazuje lažan uspeh', () => {
    vi.stubEnv('VITE_COMMERCE_ENABLED', 'true');
    render(<App />);
    expect(screen.queryByText('4,99 €')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByRole('heading', { name: 'Slovolov Family' })).toBeVisible();
    expect(screen.getByText(/jednokratno/i)).toBeVisible();
    expect(screen.getByText(/Android\/iOS aplikaciji/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Vrati kupovinu/i })).toBeDisabled();
  });

  it('potvrđeno porodično pravo prikazuje trajno otključan sadržaj', () => {
    useProgressStore.getState().grantFamilyAccess('store');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();

    expect(screen.getByText('Otključano zauvek')).toBeVisible();
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

  it('bojanka ima paletu, gumicu i lokalno čuvanje', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bojanka/i }));
    expect(screen.getByLabelText(/Bojanka za slovo/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Gumica/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Sačuvaj crtež/i })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Sačuvaj crtež/i }));
    expect(screen.getByText(/Crtež za А je sačuvan/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Bojanka Б' })).toBeVisible();
  });

  it('roditelj unosi ime novog profila i kasnije ga menja', () => {
    useProgressStore.getState().grantFamilyAccess('store');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
    unlockParentSettings();
    fireEvent.click(screen.getByRole('button', { name: /Dodaj profil/i }));

    fireEvent.change(screen.getByLabelText('Ime deteta'), { target: { value: 'Лука' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj profil' }));
    expect(screen.getByText('Лука')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Promeni ime za Лука' }));
    fireEvent.change(screen.getByLabelText('Novo ime deteta'), { target: { value: 'Лазар' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sačuvaj ime' }));
    expect(screen.getByText('Лазар')).toBeVisible();
    expect(screen.queryByText('Лука')).not.toBeInTheDocument();
  });
});
