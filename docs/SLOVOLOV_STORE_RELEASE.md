# Slovolov — paket za Google Play i Apple App Store

Status: kod i lokalni paketi su pripremljeni. Objavljivanje nije moguće bez
vlasničkih naloga, deklaracija prodavnice i upload/potpisnih ključeva.

## Model plaćanja

- proizvod: `slovolov_family_unlock`;
- tip: jednokratni, nepotrošni proizvod;
- preporučena početna cena: 4,99 EUR, uz lokalne cene prodavnice;
- nema pretplate, reklama ni automatskog obnavljanja;
- besplatno: prvih 10 slova, brojevi 0–5, prvih 5 bajki i jedan profil;
- Family: sva slova, brojevi, bajke, dodatni profili i budući sadržaj.

Javna PWA i razvojni Android paket ostaju potpuno otključani dok proizvod
prodavnice nije aktivan. Samo store build sa
`VITE_COMMERCE_ENABLED=true` uključuje ograničenja i kupovinu. Time se
izbegava situacija u kojoj korisnik vidi zaključan sadržaj, a prodavnica još
ne može da obradi kupovinu.

## Google Play

1. Otvoriti aplikaciju `rs.slovolov.app` u Play Console.
2. Uključiti Play App Signing i sačuvati upload ključ van repozitorijuma.
3. Dodati GitHub Actions tajne:
   `SLOVOLOV_UPLOAD_KEYSTORE_BASE64`,
   `SLOVOLOV_KEYSTORE_PASSWORD`,
   `SLOVOLOV_UPLOAD_KEY_ALIAS`,
   `SLOVOLOV_UPLOAD_KEY_PASSWORD`.
4. Pokrenuti workflow `Potpisani Google Play AAB`.
5. Napraviti jednokratni proizvod `slovolov_family_unlock`, cenu 4,99 EUR i
   aktivirati ga.
6. U konzoli uneti listing iz
   `products/slovolov-web/store-listing/google-play/sr-Latn`.
7. Postaviti ciljnu grupu 4–10, odgovoriti na Families, Data safety i Content
   rating upitnike prema ovoj dokumentaciji.
8. Politika privatnosti:
   `https://slovolov-download.onrender.com/privacy.html` tek nakon potvrde da
   je ta stranica stvarno javno objavljena.
9. Prvo poslati u Internal testing. Na fizičkom uređaju proveriti kupovinu,
   Restore, roditeljski zadatak, offline režim, zvuk i mikrofon.
10. Tek nakon zelenog internog testa promovisati u Production.

Predlog Data safety odgovora mora potvrditi vlasnik u konzoli:

- nema naloga, reklama, analitike ni Slovolov servera za profile;
- ime, napredak, crteži i snimak glasa ostaju lokalno;
- kupovinu obrađuje Google Play;
- statički hosting isporučuje PWA i sadržaj;
- aplikacija je namenjena deci i roditeljima i mora proći Families proveru.

## Apple App Store

1. Potreban je Apple Developer nalog i macOS sa Xcode-om.
2. U App Store Connect napraviti aplikaciju sa bundle ID
   `rs.slovolov.app`.
3. Napraviti Non-Consumable IAP `slovolov_family_unlock`, cenu u najbližem
   nivou oko 4,99 EUR i poslati IAP na pregled sa verzijom aplikacije.
4. U Xcode-u uključiti automatsko potpisivanje i In-App Purchase capability.
5. Uneti listing iz `products/slovolov-web/store-listing/apple/sr-Latn`.
6. Popuniti Age Rating, App Privacy, Kids kategoriju i podatke za review.
7. Pokrenuti sandbox kupovinu i Restore na fizičkom iPhone/iPad uređaju.
8. Arhivirati i poslati build kroz Xcode/Transporter, zatim TestFlight.

Windows ne može napraviti potpisani iOS arhiv. To nije programski kvar, već
Apple zahtev za Xcode/macOS potpisivanje.

## Bezbednost i privatnost

- Android deklaracija traži mikrofon, a iOS sadrži jasno objašnjenje namene;
- mikrofon se aktivira samo iza roditeljskog podešavanja;
- aplikacija ne šalje niti trajno čuva snimak;
- kartične podatke nikada ne obrađuje Slovolov;
- politika privatnosti je `public/privacy.html`;
- tajne i keystore ne smeju biti commitovani.

## Dokaz pre javnog izdanja

- kompletni frontend testovi i TypeScript provera;
- proizvodni PWA build;
- Capacitor sync za Android/iOS;
- Android `bundleRelease`;
- instalacioni smoke test;
- kupovina i Restore u Google/Apple sandbox-u;
- offline start i čitanje već preuzetog sadržaja;
- roditeljska zaštita, brisanje lokalnih podataka i povrat kupovine.
