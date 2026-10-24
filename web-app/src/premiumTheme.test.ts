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

  it('iOS Premium jasno komunicira mesečnu pretplatu sa probnim periodom', () => {
    const app = readFileSync(resolve('src/App.tsx'), 'utf8');
    const styles = readFileSync(resolve('src/styles.css'), 'utf8');

    expect(app).toContain("purchaseOffer.price ?? '3,99 €'");
    expect(app).toContain('Mesečna pretplata se automatski obnavlja');
    expect(app).toContain('Pokreni ${purchaseOffer.trialDays} dana besplatno');
    expect(app).toContain('premium-world-art');
    expect(app).toContain('premium-benefits');
    expect(styles).toContain('.premium-world-island');
    expect(styles).toContain('.premium-benefits li');
  });
});
