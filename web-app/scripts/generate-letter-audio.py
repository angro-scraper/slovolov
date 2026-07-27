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
        # Puna srpska rečenica sprečava da TTS protumači znak kao englesko
        # slovo. Snimci se pakuju u aplikaciju i ne zavise od jezika telefona.
        await save(
            f"Ovo je slovo {letter['upper']}. Glas {letter['lower']}, kao u reči {example}.",
            OUTPUT_DIR / f"{prefix}-sound.mp3",
        )
        await save(
            f"{letter['upper']} kao {example}. Poslušaj: {example}.",
            OUTPUT_DIR / f"{prefix}-example.mp3",
        )
        print(f"{prefix} {letter['upper']} — {example}")


if __name__ == "__main__":
    asyncio.run(main())
