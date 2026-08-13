# Audio profili

## Citanje: Ana SRB

Modul **Citanje** koristi samo profil iz
`scripts/reading-elevenlabs-profile.json`.

Dogovoreni glas je **Ana SRB - Call center voice** u ElevenLabs nalogu vlasnika.
Stvarne vrednosti koje su potvrdene 14. avgusta 2026. su:

- model: `eleven_multilingual_v2`;
- brzina: `0.81`;
- stabilnost: `1.00`;
- slicnost: `0.27`;
- stil: `0.00`;
- Speaker Boost: ukljucen;
- izlaz: `MP3 44.1 kHz / 128 kbps`.

Ovaj profil ne menja zvukove za slova, igre, kvizove, brojeve, pohvale ili
bajke. Za izradu novog paketa snimaka potrebni su lokalno postavljeni
`ELEVENLABS_API_KEY` i `ELEVENLABS_READING_VOICE_ID`; te vrednosti nikada ne
idu u Git, aplikaciju ili Render okruzenje. Krajnja aplikacija reprodukuje samo
lokalne MP3 fajlove i ne salje decje podatke ElevenLabs-u.

## Bezbedno jednokratno lokalno podesavanje

API kljuc ostaje samo kod vlasnika. Nakon sto ga vlasnik napravi u ElevenLabs
Developer/API Keys delu, lokalno moze jednom da pokrene:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-elevenlabs-reading-credentials.ps1 -VoiceId "OVDE_ID_GLASA"
```

Skripta trazi kljuc skrivenim unosom, cuva ga samo u korisnickom Windows
okruzenju i ne prikazuje ga. ID glasa se moze kopirati iz menija glasa Ana SRB.
