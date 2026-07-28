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
        # Jedan kratak snimak po lekciji: isti glas i ista rečenica za veliko
        # slovo, dugme „Slušaj ponovo” i primer. Time nema preklapanja dva
        # različita objašnjenja niti veštačkih slogova poput „ba”, „vu” i „go”.
        await save(
            f"Ово је слово {letter['upper']}. {letter['upper']} као {example}.",
            OUTPUT_DIR / f"{prefix}-lesson.mp3",
        )
        print(f"{prefix} {letter['upper']} — {example}")


if __name__ == "__main__":
    asyncio.run(main())
