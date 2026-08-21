import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('premium Slovolov vizuelni sistem', () => {
  it('pakuje Nunito lokalno i koristi ga bez CDN zavisnosti', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    const main = readFileSync(resolve('src/main.tsx'), 'utf8');
    const styles = readFileSync(resolve('src/styles.css'), 'utf8');

    expect(packageJson.dependencies['@fontsource/nunito']).toBeDefined();
    expect(main).toContain("@fontsource/nunito/latin-ext-400.css");
    expect(main).toContain("@fontsource/nunito/cyrillic-800.css");
    expect(styles).toContain("--font-family: 'Nunito'");
    expect(styles).not.toContain('fonts.googleapis.com');
  });

  it('iOS Premium prikazuje Apple potvrđenu cenu i probni period uz jasne uslove', () => {
    const app = readFileSync(resolve('src/App.tsx'), 'utf8');
    const purchases = readFileSync(resolve('src/services/purchases.ts'), 'utf8');

    expect(app).toContain('Slovolov Premium');
    expect(app).toContain('Pokreni ${verifiedTrialDays} dana besplatno');
    expect(app).toContain('Cena i eventualni probni period biće prikazani čim ih Apple potvrdi.');
    expect(app).toContain('Pretplata se automatski obnavlja');
    expect(app).toContain('Bez reklama');
    expect(app).toContain('Prvih 7 slova, brojevi 0–10 i prve 3 priče ostaju besplatni');
    expect(app).toContain('Premium otključava svih 30 slova, brojeve 0–100, igre i Čitanje');
    expect(purchases).toContain('purchaseOfferFromProduct');
    expect(purchases).toContain('trialDaysFromBillingPeriod');
  });

  it('Moja priča koristi prirodno skrolovanje umesto sabijanja sadržaja u jedan ekran', () => {
    const app = readFileSync(resolve('src/App.tsx'), 'utf8');
    const styles = readFileSync(resolve('src/styles.css'), 'utf8');

    expect(app).toContain('className="single-screen creative-screen"');
    expect(styles).toContain('.creative-screen {');
    expect(styles).toContain('overflow-y: auto;');
    expect(styles).toContain('.creative-screen .creative-preview {');
    expect(styles).toContain('grid-template-rows: auto auto auto;');
    expect(styles).toContain('.creative-screen .creative-story-pages { overflow: visible; }');
    expect(styles).toContain('.creative-screen .creative-options { max-height: none; overflow: visible; }');
  });
});
