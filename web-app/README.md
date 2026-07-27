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
- audio-bajke prvo nude slušanje, dok se tekst uključuje dugmetom
  `Čitaj zajedno`;
- biblioteka sadrži 37 celih srpskih izdanja sa tačnim naslovom, autorom,
  izvornom Wikizvornik stranicom i revizijom;
- tekst se učitava po izboru bajke, a dete može da bira slušanje ili
  `Čitaj zajedno`;
- izabrana cela audio-bajka može se preuzeti na uređaj za offline slušanje,
  uz stvarni brojač preuzetih segmenata.

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

Aplikacija prvo reprodukuje lokalno spakovane MP3 snimke. Svih 37 celih naslova
ima srpsku naraciju glasom `sr-RS-SophieNeural` u 2.260 rečeničnih segmenata.
Android omot ih dobija u paketu, dok PWA nudi dugme za preuzimanje pojedinačne
cele bajke u offline keš. Tako ažuriranje web aplikacije ne preuzima desetine
megabajta audio-sadržaja bez odluke roditelja. Ako snimak nije dostupan,
aplikacija bira najbolji srpski glas uređaja.

Probni Piper narator nije prihvaćen i nije deo izdanja. Tekst je poslat
Microsoft Edge TTS servisu i Sophie snimci su napravljeni tek nakon izričitog
odobrenja vlasnika.

## Poreklo tekstova

Celoviti tekstovi se preuzimaju iz tačno zabeleženih revizija
Srpskog Wikizvornika. Svaki JSON u `public/content/stories` sadrži URL izvora,
autora, prevodioca kada je poznat, broj revizije i licencu. Tekstovi i njihove
izvorne oznake koriste se pod uslovima `CC BY-SA 4.0`; licenca izvornog
sadržaja ne menja licencu aplikativnog koda.
