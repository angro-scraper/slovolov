import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
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

describe('Slovolov glavni tok', () => {
  beforeEach(() => {
    useProgressStore.getState().reset();
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,crtez')
    });
  });
  afterEach(cleanup);

  it('otvara školu slova i prikazuje ćirilične reči', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Nauči slova/i }));
    fireEvent.click(screen.getByRole('button', { name: 'А а' }));
    expect(screen.getByRole('button', { name: 'Odaberi sliku: Авион' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Slušaj ponovo/i })).toBeVisible();
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

  it('čitanje ima slogove, reči i priču sa nagradnim pitanjem', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Čitanje/i }));

    expect(screen.getByRole('button', { name: 'Slogovi' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reči' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Priča' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Priča' }));
    expect(screen.getByText(/Priča 1\/20/)).toBeVisible();
    expect(screen.getByText(/Шта проналази/)).toBeVisible();
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
    const sentence = screen.getAllByRole('button', { name: /Rečenica/i })[1];
    fireEvent.click(sentence);
    const activeStory = screen.getByTestId('fairy-tale').getAttribute('data-story-id');
    expect(useProgressStore.getState().profile.storyBookmarks[activeStory ?? '']).toBe(1);
  });

  it('prikazuje bajku kao pristupačnu fullscreen slikovnicu za decu', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    const reader = screen.getByTestId('storybook-reader');
    expect(reader).toHaveAttribute('data-reader-mode', 'immersive');
    expect(screen.getByRole('img', { name: 'Ilustracija za Ивица и Марица' })).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Napredak kroz bajku' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('article', { name: 'Tekst priče' })).toBeVisible();
    expect(screen.getByText(/Snimljeni glas ima prednost/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Uvećaj tekst' }));
    expect(screen.getByRole('article', { name: 'Tekst priče' })).toHaveClass('large-text');
  });

  it('prikazuje autora i napomenu da je tekst originalna adaptacija klasika', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));

    expect(screen.getByLabelText('Izvor bajke: Braća Grim')).toBeVisible();
    expect(screen.getByText(/Originalna srpska adaptacija/i)).toBeVisible();
  });

  it('pitanje se otključava na poslednjoj strani i dodeljuje zvezdicu samo jednom', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Bajke i priče/i }));
    for (let page = 1; page < 10; page += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Sledeća stranica' }));
    }
    expect(screen.getByText('Како су Ивица и Марица први пут обележили пут?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Белим каменчићима' }));
    fireEvent.click(screen.getByRole('button', { name: 'Белим каменчићима' }));
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

  it('roditelj bira i trajno čuva težinu zadataka', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
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
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Podešavanja' }));
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
