"""Generiše lokalne srpske snimke svih 30 slova preko Edge TTS-a."""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
LETTERS_PATH = ROOT / "src" / "data" / "letters.json"
OUTPUT_DIR = ROOT / "public" / "audio" / "letters"
VOICE = "sr-RS-SophieNeural"

# Suglasnik bez samoglasnika nije prirodan govorni slog, a TTS izolovani znak
# često čita kao strano ime slova (npr. Ј kao englesko "džej"). Zato dete
# dobija čist početni glas u kratkom srpskom slogu, uz poznatu primer-reč.
PHONETIC_STARTS = {
    "А": "а", "Б": "ба", "В": "ву", "Г": "го", "Д": "дрво",
    "Ђ": "ђа", "Е": "е", "Ж": "жи", "З": "зе", "И": "и",
    "Ј": "ја", "К": "ки", "Л": "ла", "Љ": "љу", "М": "ме",
    "Н": "но", "Њ": "њу", "О": "о", "П": "па", "Р": "ри",
    "С": "со", "Т": "ти", "Ћ": "ћи", "У": "у", "Ф": "фо",
    "Х": "хлеб", "Ц": "цвет", "Ч": "ча", "Џ": "џи", "Ш": "ше",
}


async def save(text: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text=text, voice=VOICE, rate="-12%")
    await communicate.save(str(target))


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    letters = json.loads(LETTERS_PATH.read_text(encoding="utf-8"))
    for index, letter in enumerate(letters, start=1):
        prefix = f"{index:02d}"
        example = letter["words"][0]["word"]
        phonetic = PHONETIC_STARTS[letter["upper"]]
        # Izolovani znak se namerno nikada ne šalje TTS-u: zvuk se uči kroz
        # početak srpske reči, pa rezultat ne zavisi od jezika telefona.
        await save(
            (
                f"Poslušaj pažljivo početak reči {example}. "
                f"{phonetic}. {phonetic}. {example}. To je glas koji učimo."
            ),
            OUTPUT_DIR / f"{prefix}-sound.mp3",
        )
        await save(
            (
                f"{example}. Počinje glasom kao u ovom kratkom početku: "
                f"{phonetic}. Poslušaj ponovo: {example}."
            ),
            OUTPUT_DIR / f"{prefix}-example.mp3",
        )
        print(f"{prefix} {letter['upper']} — {example}")


if __name__ == "__main__":
    asyncio.run(main())
