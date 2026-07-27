# Slovolov 2.7

Slovolov je radosna edukativna PWA i mobilna aplikacija za decu uzrasta
3–10 godina. Dete uči svih 30 srpskih slova na ćirilici i latinici, sluša
izgovor, prati putanju slova, boji, igra se, čita priče i osvaja nagrade.

Glavni proizvod je jedna React + TypeScript aplikacija. PWA radi u browseru
i može da se instalira, dok Capacitor koristi isti kod za Android i iOS omot.
Sadržaj, slike i audio čuvaju se lokalno da bi aplikacija radila i bez mreže.

## Šta stvarno radi

- svih 30 tačnih slova srpske azbuke i abecede, uključujući `Đ`, `Lj`, `Nj`,
  `Ć`, `Č`, `Dž`, `Š` i `Ž`;
- cela lokalna aplikacija je dostupna bez plaćanja, zaključavanja i reklama;
- svako slovo ima veliku i malu varijantu, reč, lokalnu ilustraciju i zasebnu
  animaciju: avion leti, baloni se podižu, vuk skače, golub leti, drvo se
  njiše i tako redom za svih 30 slova;
- posebna vektorska putanja i animirani vodič za pisanje svakog slova;
- merenje tačnosti, ponovno crtanje, pohvala, zvezdice i proslava;
- 37 celih srpskih izdanja bajki i narodnih pripovedaka, sa 44.868 reči i
  tačnim izvorom, autorom, revizijom i licencom Srpskog Wikizvornika;
- 2.260 lokalno spakovanih MP3 segmenata koje čita topli ženski glas
  `sr-RS-SophieNeural`;
- Android paket sadrži celu offline biblioteku, dok roditelj u PWA verziji
  bira koju celu bajku želi da sačuva bez interneta i vidi stvarni napredak;
- bojanka za svako slovo sa bojama, tri veličine četkice, gumicom, undo
  funkcijom, dvostrukom potvrdom brisanja i lokalnim čuvanjem;
- tri stvarne mini-igre: slovo i slika, pronađi izgovoreno slovo i baloni;
- kolekcije nagrada: životinje, vozila, voće i priroda, kao i medalje;
- sadržaj za uzraste 3–5, 6–8 i 8–10 godina;
- roditeljski panel zaštićen matematičkim pitanjem, sa stvarnim napretkom,
  zvukom, izborom pisma, tamnom temom i dvostrukim resetom;
- lokalno čuvanje napretka i responsive prikaz za telefon i tablet.

## Pokretanje

Iz foldera `web-app`:

```text
npm ci
npm run dev
```

Produkcijski web build:

```text
npm run build
```

Android debug APK se nalazi u `artifacts/Slovolov-2.7.0-debug.apk`, a javna
PWA verzija u folderu `web-download`.

## Audio

Objavljena verzija koristi jedan dosledan, topao ženski naratorski glas.
Planirano proširenje audio-drame koristiće muški glas za kraljeve i čarobnjake
i mlađi glas za decu i vile, tek nakon uredničkog označavanja dijaloga. Skripta
`scripts/build_neural_story_audio.mjs` omogućava proverljivo ponovno generisanje
audio biblioteke.

## Plaćanje

Plaćanje i zaključavanje sadržaja su isključeni. Cela aplikacija je trenutno
dostupna. Nema Store/IAP poziva, naloga, API ključeva ni mrežnih servisa.

## Lokalni podaci

Napredak, zvezdice, vreme učenja, podešavanja i crteži ostaju isključivo na
uređaju. Reset napretka je dostupan samo u roditeljskom panelu i zahteva dve
potvrde.
