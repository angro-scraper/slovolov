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
