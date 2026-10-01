# Audio profili

## Čitanje i Moja avantura: ElevenLabs dečji glas

Sledeći paket za module **Čitanje** i **Moja avantura** koristi profil iz
`scripts/reading-elevenlabs-profile.json` i generator
`scripts/generate-reading-elevenlabs-audio.py`.

Dogovoreni glas je ElevenLabs glas čiji je ID `0jvpZ98RZwx5FBOSZAc3`.
Tekst se pre slanja obavezno pretvara u **srpsku latinicu**, da bi izgovor
glasova `lj`, `nj`, `dž`, `đ`, `č`, `ć` i `ž` ostao prirodan.

- model: `eleven_multilingual_v2`;
- brzina: `0.84`;
- stabilnost: `1.00`;
- sličnost: `0.42`;
- stil: `0`;
- Speaker Boost: uključen;
- izlaz: `mp3_44100_128`.

Ovaj profil ne menja zvukove za slova, igre, kvizove, brojeve, pohvale ili
bajke. Krajnja aplikacija reprodukuje samo lokalne MP3 fajlove i ne šalje
dečje podatke TTS servisu.

## Bezbedno jednokratno lokalno podešavanje

Za izradu paketa potreban je ElevenLabs ključ samo u lokalnom procesu koji
vlasnik pokreće; ne unosi se u repozitorijum niti se ispisuje u logove:

```powershell
& .\scripts\set-elevenlabs-reading-credentials.ps1 -VoiceId '0jvpZ98RZwx5FBOSZAc3'
py .\scripts\generate-reading-elevenlabs-audio.py --pronunciation-preview
py .\scripts\generate-reading-elevenlabs-audio.py --hard-pronunciation-preview
py .\scripts\generate-reading-elevenlabs-audio.py --generate --promote
```

Pre celog paketa obavezno se poslušaju kratki i teški uzorci. Skripta zatim
pravi svih 241 snimak u izolovanom staging direktorijumu i menja javni paket
tek kada je svaki MP3 provereno ispravan.
