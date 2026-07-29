"""Generiše odobrene lokalne Sophie snimke za module čitanja.

Skript ne koristi glas telefona. Svi izlazi su statični MP3 resursi koji se
isporučuju uz PWA/Capacitor aplikaciju.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts


VOICE = "sr-RS-SophieNeural"
RATE = "-18%"
ROOT = Path(__file__).resolve().parents[1]
AUDIO_ROOT = ROOT / "public" / "audio" / "reading"

RHYME_ROUNDS = [
    ("mak", "Koja reč se rimuje sa rečju mak?", "Mak i rak se rimuju."),
    ("dan", "Koja reč se rimuje sa rečju dan?", "Dan i san se rimuju."),
    ("cvet", "Koja reč se rimuje sa rečju cvet?", "Cvet i svet se rimuju."),
    ("kosa", "Koja reč se rimuje sa rečju kosa?", "Kosa i rosa se rimuju."),
    ("med", "Koja reč se rimuje sa rečju med?", "Med i led se rimuju."),
    ("mis", "Koja reč se rimuje sa rečju miš?", "Miš i kiš se rimuju."),
    ("zec", "Koja reč se rimuje sa rečju zec?", "Zec i mesec se rimuju."),
    ("suma", "Koja reč se rimuje sa rečju šuma?", "Šuma i guma se rimuju."),
    ("more", "Koja reč se rimuje sa rečju more?", "More i gore se rimuju."),
    ("ptica", "Koja reč se rimuje sa rečju ptica?", "Ptica i žica se rimuju."),
]

SYLLABLES = [
    ("ma", "ma"), ("me", "me"), ("mi", "mi"), ("mo", "mo"), ("mu", "mu"),
    ("sa", "sa"), ("se", "se"), ("si", "si"), ("so", "so"), ("su", "su"),
    ("la", "la"), ("le", "le"), ("li", "li"), ("lo", "lo"), ("lu", "lu"),
    ("ra", "ra"), ("re", "re"), ("ri", "ri"), ("ro", "ro"), ("ru", "ru"),
    ("na", "na"), ("ne", "ne"), ("ni", "ni"), ("no", "no"), ("nu", "nu"),
]

WORDS = [
    ("mama", "mama"), ("sova", "sova"), ("suma", "šuma"),
    ("tata", "tata"), ("beba", "beba"), ("kuca", "kuća"),
    ("meda", "meda"), ("riba", "riba"), ("patka", "patka"),
    ("sunce", "sunce"), ("reka", "reka"), ("cvet", "cvet"),
    ("hleb", "hleb"), ("sir", "sir"), ("jabuka", "jabuka"),
    ("avion", "avion"), ("voz", "voz"), ("brod", "brod"),
    ("lopta", "lopta"), ("lutka", "lutka"), ("zmaj", "zmaj"),
    ("kisa", "kiša"), ("sneg", "sneg"), ("oblak", "oblak"),
    ("pcela", "pčela"), ("leptir", "leptir"), ("puz", "puž"),
    ("knjiga", "knjiga"), ("olovka", "olovka"), ("torba", "torba"),
]

ADVENTURES = [
    ("lana-cvet", "Lana", "vrta", "crveni cvet"),
    ("vuk-zmaj", "Vuk", "brda", "plavog zmaja"),
    ("mila-sova", "Mila", "šume", "mudru sovu"),
    ("luka-kljuc", "Luka", "starog hrasta", "mali ključ"),
    ("ana-balon", "Ana", "parka", "žuti balon"),
    ("bojan-brod", "Bojan", "reke", "drveni brod"),
    ("iva-jez", "Iva", "livade", "malog ježa"),
    ("marko-kompas", "Marko", "planine", "stari kompas"),
    ("nina-zvono", "Nina", "seoskog trga", "srebrno zvono"),
    ("ognjen-knjiga", "Ognjen", "biblioteke", "knjigu o zvezdama"),
    ("petra-leptir", "Petra", "cvetne bašte", "šarenog leptira"),
    ("rada-skoljka", "Rada", "morske obale", "belu školjku"),
    ("sava-voz", "Sava", "železničke stanice", "crveni voz"),
    ("tara-zvezda", "Tara", "tihe poljane", "sjajnu zvezdu"),
    ("uros-fenjer", "Uroš", "stare kule", "zeleni fenjer"),
    ("filip-robot", "Filip", "radionice", "malog robota"),
    ("hana-mace", "Hana", "dvorišta", "belo mače"),
    ("cana-kosara", "Cana", "voćnjaka", "korpu jabuka"),
    ("ceda-camac", "Čeda", "mirnog jezera", "mali čamac"),
    ("sana-lopta", "Šana", "školskog igrališta", "šarenu loptu"),
]

LITERACY_PROMPTS = [
    "Napiši veliko slovo A.",
    "Napiši reč avion.",
    "Dodirni reči pravilnim redom i složi: Sova leti.",
    "Napiši reč ljuljaška.",
    "Složi reči pravilnim redom: Mala sova leti iznad šume.",
    "Složi tri rečenice pravilnim redom i napravi malu priču.",
]


def story_segments() -> list[tuple[Path, str]]:
    segments: list[tuple[Path, str]] = []
    for story_id, name, destination, object_accusative in ADVENTURES:
        stories = {
            "4-6": [
                f"{name} ide do {destination}.",
                f"Tamo vidi {object_accusative}.",
            ],
            "6-8": [
                f"{name} kreće do {destination} u novu avanturu.",
                f"Na stazi pronalazi {object_accusative}.",
                "Kod kuće svima priča šta se dogodilo.",
            ],
            "8-10": [
                f"Tokom puta do {destination}, {name} primećuje neobičan trag.",
                f"Trag vodi do {object_accusative}, pažljivo sakrivenog pored staze.",
                f"Na kraju {name} čuva nalaz i zapisuje celu pustolovinu.",
            ],
        }
        for age, sentences in stories.items():
            for index, sentence in enumerate(sentences, start=1):
                segments.append((AUDIO_ROOT / "stories" / f"{story_id}-{age}-{index}.mp3", sentence))
    return segments


def all_segments() -> list[tuple[Path, str]]:
    segments: list[tuple[Path, str]] = []
    for round_id, prompt, result in RHYME_ROUNDS:
        segments.extend([
            (AUDIO_ROOT / f"rhyme-{round_id}-prompt.mp3", prompt),
            (AUDIO_ROOT / f"rhyme-{round_id}-result.mp3", result),
        ])
    segments.extend((AUDIO_ROOT / f"syllable-{slug}.mp3", text) for slug, text in SYLLABLES)
    segments.extend((AUDIO_ROOT / f"word-{slug}.mp3", text) for slug, text in WORDS)
    segments.extend(story_segments())
    segments.extend(
        (AUDIO_ROOT / "adventure" / f"literacy-{index}.mp3", prompt)
        for index, prompt in enumerate(LITERACY_PROMPTS, start=1)
    )
    return segments


async def generate(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text=text, voice=VOICE, rate=RATE).save(str(path))


async def main() -> None:
    segments = all_segments()
    if len(segments) != 241:
        raise RuntimeError(f"Očekivano je 241 segmenata, pronađeno {len(segments)}.")
    semaphore = asyncio.Semaphore(6)

    async def generate_one(index: int, path: Path, text: str) -> None:
        async with semaphore:
            await generate(path, text)
            print(f"[{index:03d}/{len(segments)}] {path.relative_to(ROOT)}")

    await asyncio.gather(*(
        generate_one(index, path, text)
        for index, (path, text) in enumerate(segments, start=1)
    ))


if __name__ == "__main__":
    asyncio.run(main())
