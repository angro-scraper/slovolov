# Slovolov Family — pošten i pristupačan model

## Ponuda

Slovolov nema reklame ni pretplatu. Osnovni sadržaj ostaje trajno besplatan:

- prvih 10 slova azbuke, uključujući učenje, pisanje i bojanku;
- brojevi od 0 do 5;
- prvih 5 celih bajki;
- osnovne igre, kviz, napredak i jedan lokalni profil deteta.

Jednokratna kupovina **Slovolov Family** otključava:

- svih 30 slova i brojeve 0–10;
- svih 37 celih bajki i buduća proširenja sadržaja;
- više profila dece na istom uređaju.

Predložena početna cena je **4,99 EUR jednokratno**. Cena se ne upisuje kao
transakcioni iznos u kod: Google Play i Apple vraćaju stvarnu lokalizovanu
cenu za zemlju i valutu roditelja. Oznaka 4,99 EUR na webu je informativna.

## Bezbednosna pravila

- Kupovina je isključivo iza roditeljske provere.
- Koristi se jedan non-consumable proizvod `slovolov_family_unlock`.
- `pending`, otkazana ili neuspešna kupovina ne otključava sadržaj.
- Pravo se dodeljuje tek kada prodavnica prijavi stvarno vlasništvo.
- „Vrati kupovinu” proverava isti Google/Apple nalog i ne izmišlja uspeh.
- Pravo je zajedničko svim lokalnim profilima i ne briše se resetovanjem
  dečjeg napretka.
- Javna Web/PWA i razvojna izdanja ne naplaćuju i trenutno ostaju potpuno
  otključana. Ograničenja se uključuju samo u namenskom store buildu sa
  `VITE_COMMERCE_ENABLED=true`, kada je proizvod stvarno aktivan.

Kupovina i vraćanje zahtevaju vezu sa prodavnicom. Već preuzet obrazovni
sadržaj i napredak nastavljaju da rade offline.

## Google Play podešavanje

1. U Play Console napraviti aplikaciju sa paketom `rs.slovolov.app`.
2. U **Monetize > Products > In-app products** napraviti proizvod:
   - ID: `slovolov_family_unlock`;
   - tip: jednokratni proizvod, non-consumable;
   - početna cena: 4,99 EUR uz automatske lokalne cene.
3. Aktivirati proizvod.
4. Postaviti AAB na Internal testing i dodati license tester naloge.
5. Instalirati aplikaciju isključivo preko Play test linka; side-load debug
   APK ne može dokazati stvarnu Play kupovinu.
6. Dokazati: kupovina, otkazivanje, pending tok, ponovno pokretanje,
   reinstalacija i „Vrati kupovinu”.

Android omot koristi `cordova-plugin-purchase` 13.18.0 i Google Billing
9.0.0. Workflow `store-aab.yml` pravi commerce-enabled potpisani AAB tek kada
vlasnik bezbedno doda upload ključ kroz GitHub tajne.

## Apple podešavanje

1. U App Store Connect napraviti aplikaciju za bundle `rs.slovolov.app`.
2. Napraviti non-consumable In-App Purchase sa istim ID-em
   `slovolov_family_unlock`.
3. Dodati lokalizovan naziv, opis, cenu i podatke za pregled.
4. Na macOS računaru pokrenuti `npm run cap:sync`, instalirati CocoaPods,
   otvoriti iOS projekat u Xcode-u i podesiti signing.
5. Testirati kupovinu i restore preko StoreKit sandbox/TestFlight naloga.

Potpisani iOS build nije moguć na Windowsu.

## Pre produkcije

Trenutna verzija namerno koristi lokalno store vlasništvo non-consumable
proizvoda, bez naloga i bez sopstvenog servera. Pre komercijalnog izdanja
preporučuje se serverska verifikacija računa radi bolje zaštite od prevare i
pouzdanije podrške korisnicima. To zahteva zaseban privacy/security pregled i
ne sme se uključiti sa tajnim ključem u mobilnom kodu.
