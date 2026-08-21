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
