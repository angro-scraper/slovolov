# Slovolov Web

Jedinstvena React + TypeScript aplikacija za web/PWA, Android i iOS omote.

## Dečji tokovi

- svih 30 slova prikazuju veliko i malo slovo;
- izbor tačne slike daje jednu zvezdicu i vodi na sledeće slovo;
- pisanje podržava velika i mala slova, više poteza i proveru praćenja oblika;
- potvrda „Bravo! Naučio si slovo” pojavljuje se samo posle uspešne provere;
- brojevi 0–10 povezuju cifru, izgovor i količinu;
- čitanje napreduje kroz slogove, reči i kratku priču sa pitanjem;
- priče imaju zasebne nivoe za uzrast 4–6, 6–8 i 8–10 godina;
- dnevni izazov spaja slovo, reč i broj i daje tri zvezdice jednom dnevno;
- memory igra povezuje slova i odgovarajuće slike;
- brojevi 0–10 mogu i da se pišu na proverenom platnu;
- roditelj bira laki, standardni ili izazovni nivo po profilu;
- napredak za slova, brojeve i čitanje čuva se odvojeno po profilu deteta.

## Lokalno

```powershell
npm install
npm run dev
```

## Provere

```powershell
npm test
npm run typecheck
npm run build
```

## Mobilni omoti

```powershell
npm run cap:sync
npx cap open android
```

iOS projekat deli isti `dist`, ali potpisani IPA i App Store objava zahtevaju
macOS, Xcode i Apple Developer nalog.

## Audio

Aplikacija prvo traži lokalni snimak u `public/audio`, a zatim koristi srpski
sistemski glas uređaja. Profesionalni studijski snimci nisu lažno predstavljeni
kao završeni resurs; mogu se dodavati bez promene aplikacionog koda.
