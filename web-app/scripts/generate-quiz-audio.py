"""Generiše 90 lokalnih srpskih audio-pitanja za slikovni kviz."""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
LETTERS_PATH = ROOT / "src" / "data" / "letters.json"
OUTPUT_DIR = ROOT / "public" / "audio" / "quiz"
VOICE = "sr-RS-SophieNeural"
QUIZ_RATE = "-18%"


async def save(text: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=QUIZ_RATE)
    await communicate.save(str(target))


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    letters = json.loads(LETTERS_PATH.read_text(encoding="utf-8"))
    number = 0
    for letter in letters:
        for entry in letter["words"]:
            number += 1
            word = entry["word"]
            await save(
                f"На слици је {word}. Које је прво слово?",
                OUTPUT_DIR / f"{number:02d}.mp3",
            )
            print(f"{number:02d} {word}")


if __name__ == "__main__":
    asyncio.run(main())
