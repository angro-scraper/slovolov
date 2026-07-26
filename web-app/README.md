# Slovolov Web

Jedinstvena React + TypeScript aplikacija za web/PWA, Android i iOS omote.

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
