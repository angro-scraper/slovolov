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
