# Slovolov

Slovolov je radosna, potpuno offline Flutter aplikacija za decu uzrasta
3–10 godina. Dete uči svih 30 srpskih slova na ćirilici i latinici, sluša
izgovor, prati stvarnu putanju slova, boji, igra se i osvaja nagrade.

## Šta stvarno radi

- svih 30 tačnih slova srpske azbuke i abecede, uključujući `Đ`, `Lj`, `Nj`,
  `Ć`, `Č`, `Dž`, `Š` i `Ž`;
- cela lokalna aplikacija je dostupna bez plaćanja, zaključavanja i reklama;
- svako slovo ima veliku i malu varijantu, reč, lokalnu ilustraciju i zasebnu
  animaciju: avion leti, baloni se podižu, vuk skače, golub leti, drvo se
  njiše i tako redom za svih 30 slova;
- posebna vektorska putanja i animirani vodič za pisanje svakog slova;
- merenje tačnosti, ponovno crtanje, pohvala, zvezdice i proslava;
- offline izgovor slova, reči, uputstva i pohvale preko Android/iOS sistemskog
  TTS glasa `sr-RS`, uz bezbedan fallback ako glas nije instaliran;
- bojanka za svako slovo sa bojama, tri veličine četkice, gumicom, undo
  funkcijom, dvostrukom potvrdom brisanja i lokalnim čuvanjem;
- tri stvarne mini-igre: slovo i slika, pronađi izgovoreno slovo i baloni;
- kolekcije nagrada: životinje, vozila, voće i priroda, kao i medalje;
- sadržaj za uzraste 3–5, 6–8 i 8–10 godina;
- roditeljski panel zaštićen matematičkim pitanjem, sa stvarnim napretkom,
  zvukom, izborom pisma, tamnom temom i dvostrukim resetom;
- Riverpod podešavanja, lokalna persistence i responsive prikaz za telefon i
  tablet.

## Pokretanje

Iz foldera `products/slovoigra`:

```text
C:\flutter\bin\flutter.bat pub get
C:\flutter\bin\flutter.bat run
```

Za Android debug APK:

```text
C:\flutter\bin\flutter.bat build apk --debug
```

APK se nalazi u `build/app/outputs/flutter-apk/app-debug.apk`.

## Audio

Aplikacija ne koristi internet za govor. Na telefonu treba da bude instaliran
srpski sistemski glas. Ako nedostaje, dete dobija jasnu poruku, a aplikacija
nastavlja da radi bez rušenja.

## Plaćanje

Plaćanje i zaključavanje sadržaja su isključeni. Cela aplikacija je trenutno
dostupna. Nema Store/IAP poziva, naloga, API ključeva ni mrežnih servisa.

## Lokalni podaci

Napredak, zvezdice, vreme učenja, podešavanja i crteži ostaju isključivo na
uređaju. Reset napretka je dostupan samo u roditeljskom panelu i zahteva dve
potvrde.
