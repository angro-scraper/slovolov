# Progres

## Android audio pouzdanost — 21. avgust 2026.

Problem je reprodukovan pregledom nativnog toka: `MediaPlayer.prepareAsync()` je
dobijao `AssetFileDescriptor` iz bloka koji ga zatvara odmah nakon
`setDataSource()`. Pojedini Android 13 tableti i telefoni zato nisu mogli
pouzdano da otvore lokalni MP3. Aktivnost je, nezavisno od reprodukcije,
zadrzavala audio fokus tokom celog prikaza aplikacije.

Izmena:

- descriptor lokalnog APK snimka ostaje otvoren do zavrsetka, greske ili Stop
  akcije;
- fokus se uzima samo dok snimak stvarno svira i odmah oslobadja nakon toga;
- privremeni gubitak fokusa pauzira i bezbedno nastavlja snimak;
- potpuni gubitak fokusa bezbedno zaustavlja plejer;
- `MainActivity` vise ne trazi audio fokus na svakom `onResume`.

Provere:

- `npm test -- --run src/nativeShell.test.ts src/services/nativeAudioPlayback.test.ts src/services/speech.test.ts src/services/narration.test.ts` — 25 passed;
- `npm test -- --run --reporter=dot` — 47 test fajlova, 221 passed;
- `npm run cap:sync` — uspesno kopira web i lokalne audio resurse u Android omot;
- `ANDROID_HOME=C:\\Users\\49162\\AppData\\Local\\Android\\Sdk .\\gradlew.bat :app:assembleDebug` — BUILD SUCCESSFUL.

U trenutku provere nijedan Android uredjaj ili emulator nije bio povezan kroz
`adb devices`, pa stvarni zvucni smoke test mora biti ponovljen na prijavljenom
tabletu/telefonu pre javne Play objave.

## Kandidat 3.4.1 — 25. oktobar 2026.

- Polazna tačka je izdanje 3.4.0 (`8b62cdb`) i tri lokalna commita za vraćanje
  odobrenih naratora, tri odgovora u pametnoj lekciji i odloženo keširanje zvuka
  (`64926a8`, `3e4bace`, `001400d`). Stari prototip nije uključen.
- Kandidat je podignut na Android `versionCode 31` / `versionName 3.4.1` i iOS
  marketinšku verziju `3.4.1`; Codemagic sam dodeljuje sledeći raspoloživi iOS
  build broj. Android 3.4.0 (30) je u trenutku provere i dalje na Play pregledu;
  iOS 3.4.0 build 15 je `Ready for Distribution`.
- Provere: `npm test -- --maxWorkers=2` — 52 fajla, 248/248 testova;
  `npm run build` — uspešno, 144 PWA precache stavke (poznato upozorenje za
  glavni JS paket od 548,81 kB); `git diff --check` — bez whitespace grešaka.
- U ovoj tački Android 3.4.1 (31) i iOS 3.4.1 još nisu poslati prodavnicama.

## Predaja kandidata 3.4.1 prodavnicama — 25. oktobar 2026.

- Commit `212bcb6` je poslat u namenski javni repozitorijum
  `angro-scraper/slovolov` na `main`, uz vlasnikovo izričito odobrenje za
  izdavanje. Stariji prototip i BriefAI nisu dirani.
- GitHub Actions `store-aab.yml`, run `40183366745`, uspešno je završio testove,
  Capacitor sinhronizaciju i potpisani Android bundle. Preuzet je
  `app-release.aab` (79.870.950 bajtova), SHA-256
  `9E9308F8D10F7DF51829382BF4E8A17FE2E4794A1D2C5DDD627898943E34DF2F`;
  `jarsigner -verify` je potvrdio `jar verified`.
- Sa Google Play pregleda povučen je stari zahtev za 30 (3.4.0). U proizvodni
  kanal dodat je tačno bundle 31 (3.4.1), cilj SDK 36, sa 100% uvođenjem u sve
  prethodno ciljane zemlje. Play prikazuje novu verziju kao jedinu promenu na
  pregledu. Jedino neblokirajuće upozorenje odnosi se na fajl za odmaskiranje.
- U App Store Connect napravljen je iOS nacrt 3.4.1 i sačuvani su opis promena
  i tačne napomene za pregled. Codemagic App Store Release je ručno pokrenut
  iz taga `ios-release-3.4.1-20261025`, build
  `6addd9434a72334e32e4f6b5`. Testovi, sinhronizacija, potpisivanje i IPA
  izrada su prošli; otprema builda 16, verzije 3.4.1, za `rs.slovolov.app`
  uspela je bez grešaka, sa minimumom iOS 15.0. Codemagic je potom podneo
  verziju Apple-u na pregled; App Store Connect nezavisno prikazuje iOS 3.4.1,
  build 16, sa statusom `Waiting for Review`.
- Završna provera: Google Play prikazuje samo proizvodnu 31 (3.4.1) pod
  `Promene na pregledu`, a Apple iOS 3.4.1 build 16 kao `Waiting for Review`.
  Obe prodavnice su podešene za javno izdavanje posle odobrenja, ali nijedna
  nova verzija još nije potvrđena kao javno dostupna.

## Kandidat 3.4.2 — samo bojanka, 26. oktobar 2026.

- Osnova je javni commit `212bcb6` za već poslato izdanje 3.4.1; lokalni
  `8e55678` iznad njega menjao je samo ovaj izveštaj. Rad je na grani
  `codex/autonomous-stabilization/coloring-3-4-2`, bez zahvata u naratore,
  pretplatu, čitanje, lekciju ili ostale ekrane.
- Preneti su samo prikaz i interakcija bojanke, 11 grafičkih fajlova i testovi.
  Svih 11 fajlova su SHA-256 identični prethodno pregledanim lokalnim crtežima.
  Novi regresioni test prolazi kroz svih 30 predmeta, proverava rutiranje i
  postojanje odgovarajućeg fajla; odvojene konture čuvaju avion, balon, ekser,
  kita, ćilim i hleb od prelivanja susednih sličica.
- Neophodna oznaka novog izdanja je 3.4.2: Android `versionCode 32`, iOS
  izvorni build 17. Codemagic i dalje sam određuje sledeći slobodan iOS build
  broj i zadržava postojeće store-safe/premium postavke.
- Polazna zbirka pre izmena: `npm test -- --run --maxWorkers=2` — 248/248.
  Posle portovanja: ista komanda — 258/258; ciljani testovi nakon konačne
  provere svih 30 putanja — 74/74. `npm run build` i oba store-safe builda
  (Android i iOS promenljive kao u objavnom toku) su uspešni.
- `npx cap copy android`, `:app:installDebug` za zasebni
  `rs.slovolov.app.coloringpreview`, `npx cap sync android`, `:app:bundleRelease`
  i `npx cap copy ios` su uspešni. Emulator prikazuje čiste crteže za predmet
  1 (avion) i 7 (ekser), bez pada aplikacije; snimci su u
  `C:\Users\49162\AppData\Local\Temp\slovolov-release-coloring-1.png` i
  `C:\Users\49162\AppData\Local\Temp\slovolov-release-coloring-7.png`.
- Lokalni AAB ima svih 11 grafičkih fajlova, ali je **nepotpisan** (`jarsigner`
  javlja `jar is unsigned`), pa nije za Play upload. Potpisani paket zahteva
  postojeći GitHub Actions secret tok; iOS IPA zahteva Codemagic. Do ovog
  zapisa nije bilo push-a, pokretanja tih tokova niti predaje prodavnicama.
