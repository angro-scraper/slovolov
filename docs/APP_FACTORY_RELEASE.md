# Slovolov — lokalni release

Slovolov je offline Flutter aplikacija za Android i iOS. Dečji napredak,
crteži, podešavanja i nagrade ostaju na uređaju. Audio koristi ugrađeni
sistemski srpski glas, bez slanja sadržaja na internet.

## Sadržaj ovog izdanja

- potpuno otključan katalog svih 30 srpskih slova;
- animirane ilustracije povezane sa svakim slovom;
- crtanje sa animiranim vodičem, merenjem tačnosti i proslavom;
- govor slova, reči, uputstava i pohvala;
- bojanka po slovima;
- tri mini-igre;
- nagrade, kolekcije i medalje;
- roditeljska zaštita, svetla/tamna tema i izbor pisma;
- responsive telefon/tablet raspored i lokalna persistence.

## Provera

Pre lokalnog release-a pokreću se `flutter test`, `flutter analyze` i Android
debug APK build. Bez deploy-a i spoljne objave. APK se zatim instalira na
emulator, a UI stablo, ključni
tokovi, TTS odgovor i Android crash log se proveravaju stvarnim ADB pozivima.

## Poznata ograničenja

- Kvalitet izgovora zavisi od srpskog TTS glasa instaliranog na telefonu.
- Emoji ilustracije zavise od sistemskog fonta uređaja, dok su putanje slova,
  kontrole i animacije nacrtane lokalnim Flutter kodom.
- iOS build zahteva macOS/Xcode; iOS platform channel je implementiran, ali
  ovaj Windows računar može da napravi i pokrene samo Android izdanje.
- Nema deploy-a, prodavnice, naloga, naplate ni mrežnih servisa.

## Rollback

Prethodni lokalni APK ostaje dostupan dok vlasnik ne potvrdi novu verziju.
