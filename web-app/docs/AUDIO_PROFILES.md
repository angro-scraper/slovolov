# Audio profili

## Citanje i Moja avantura: Sophie

Moduli **Citanje** i **Moja avantura** koriste samo profil iz
`scripts/reading-sophie-profile.json` i generator
`scripts/generate-reading-sophie-audio.py`.

Dogovoreni glas je **Sophie** (`sr-RS-SophieNeural`), isti glas koji govori
**„Bravo! Tačan odgovor!”**. Podešavanja su namerno ista kao u
`scripts/generate-letter-audio.py` za pohvale:

- glas: `sr-RS-SophieNeural`;
- brzina: `-18%`;
- izlaz: `audio-24khz-48kbitrate-mono-mp3`.

Ovaj profil ne menja zvukove za slova, igre, kvizove, brojeve, pohvale ili
bajke, jer oni već koriste Sophie ili sopstveni snimljeni naratorski paket.
Krajnja aplikacija reprodukuje samo lokalne MP3 fajlove i ne šalje dečje
podatke bilo kom TTS servisu.

## Bezbedno jednokratno lokalno podesavanje

Za izradu paketa nije potreban ElevenLabs ključ. Nakon instalacije paketa
`edge-tts`, lokalno se pokreće:

```powershell
py -m pip install edge-tts
py .\scripts\generate-reading-sophie-audio.py --generate --promote
```

Skripta prvo pravi 241 snimak u izolovanom staging direktorijumu i menja javni
paket tek kada su svi MP3 fajlovi provereni.
