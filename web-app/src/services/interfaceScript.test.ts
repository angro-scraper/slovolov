import { describe, expect, it } from 'vitest';
import { applyInterfaceScript, convertInterfaceText, toCyrillic } from './interfaceScript';

describe('dosledno pismo celog interfejsa', () => {
  it('ispravno pretvara srpsku latinicu i digrafe u ćirilicu', () => {
    expect(toCyrillic('Nauči slova, Ljiljana, Njegoš i Džungla')).toBe(
      'Научи слова, Љиљана, Његош и Џунгла'
    );
  });

  it('pretvara mešoviti izvor u izabrano jedinstveno pismo', () => {
    expect(convertInterfaceText('Slovo Љ kao љубав', 'latin')).toBe('Slovo LJ kao ljubav');
    expect(convertInterfaceText('Slovo LJ kao ljubav', 'cyrillic')).toBe('Слово Љ као љубав');
  });

  it('menja tekst, naslov, placeholder i pristupačnu oznaku kompletnog panela', () => {
    const root = document.createElement('main');
    root.innerHTML = '<h1 title="Nauči slova">Nauči slova</h1><button aria-label="Podešavanja">Otvori</button><input placeholder="Ime deteta">';
    applyInterfaceScript(root, 'cyrillic');

    expect(root).toHaveTextContent('Научи слова');
    expect(root.querySelector('h1')).toHaveAttribute('title', 'Научи слова');
    expect(root.querySelector('button')).toHaveAttribute('aria-label', 'Подешавања');
    expect(root.querySelector('input')).toHaveAttribute('placeholder', 'Име детета');
    expect(root.lang).toBe('sr-Cyrl');
  });
});

