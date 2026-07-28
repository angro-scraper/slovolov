# Slovolov Web

Jedinstvena React + TypeScript aplikacija za web/PWA, Android i iOS omote.

## Slovolov 3.1

- `Moja lekcija` lokalno bira slovo koje detetu treba ponoviti ili sledeće
  novo slovo, na osnovu stvarnih uspešnih i neuspešnih pokušaja;
- napredak sada čuva tačnost po veštini i stvarno vreme aktivnog učenja;
- čitanje obuhvata glasove i rime, slogove, reči, tri uzrasna nivoa i
  lokalnu vežbu sopstvenog izgovora;
- igre obuhvataju slovo–slika, Memory, prepoznavanje glasa i slaganje reči;
- brojevi sadrže učenje količine, pisanje i početno sabiranje;
- `Moja priča` omogućava detetu da sastavi, posluša i lokalno sačuva
  sopstvenu kratku avanturu;
- roditeljski deo je iza jednostavne računske provere i sadrži kontrole za
  veći tekst, jači kontrast, manje animacija i lakše čitljiv font;
- mikrofon je podrazumevano isključen; kada ga roditelj odobri, snimak glasa
  ostaje privremeno samo na uređaju i nikada se ne šalje na mrežu.

## Slovolov Family

- osnovni paket je trajno besplatan: prvih 10 slova, brojevi 0–5, prvih 5
  celih bajki, osnovne igre i jedan profil;
- `Slovolov Family` je jednokratno otključavanje bez pretplate i reklama;
- kupovina je iza roditeljske provere i koristi stabilan non-consumable ID
  `slovolov_family_unlock`;
- otkazana ili `pending` kupovina ne otključava sadržaj;
- web/PWA ne glumi prodavnicu; kupovina i restore postoje samo u instaliranom
  Android/iOS omotu;
- kompletno podešavanje i sandbox procedura su u
  `docs/SLOVOLOV_FAMILY.md`.

## Dečji tokovi

- svih 30 slova prikazuju veliko i malo slovo;
- izbor tačne slike daje jednu zvezdicu i vodi na sledeće slovo;
- pisanje podržava velika i mala slova, više poteza i proveru praćenja oblika;
- potvrda „Bravo! Naučio si slovo” pojavljuje se samo posle uspešne provere;
- brojevi 0–100 postavljaju snimljeno pitanje, prikazuju samo sličice i
  automatski vode na sledeći broj posle tačnog odgovora;
- čitanje napreduje kroz slogove, reči i kratku priču sa pitanjem;
- priče imaju zasebne nivoe za uzrast 4–6, 6–8 i 8–10 godina;
- dnevni izazov spaja slovo, reč i broj i daje tri zvezdice jednom dnevno;
- memory igra povezuje slova i odgovarajuće slike;
- brojevi 0–100 mogu i da se pišu na proverenom platnu;
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
