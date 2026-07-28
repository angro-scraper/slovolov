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
FEEDBACK_DIR = ROOT / "public" / "audio" / "feedback"
NUMBER_DIR = ROOT / "public" / "audio" / "numbers"
VOICE = "sr-RS-SophieNeural"
LETTER_RATE = "-28%"
FEEDBACK_RATE = "-18%"

SMALL_NUMBERS = [
    "нула", "један", "два", "три", "четири", "пет", "шест", "седам",
    "осам", "девет", "десет", "једанаест", "дванаест", "тринаест",
    "четрнаест", "петнаест", "шеснаест", "седамнаест", "осамнаест",
    "деветнаест",
]
TENS = [
    "", "", "двадесет", "тридесет", "четрдесет", "педесет",
    "шездесет", "седамдесет", "осамдесет", "деведесет",
]


def number_word(value: int) -> str:
    if value == 100:
        return "сто"
    if value < 20:
        return SMALL_NUMBERS[value]
    ones = value % 10
    tens_word = TENS[value // 10]
    return tens_word if ones == 0 else f"{tens_word} {SMALL_NUMBERS[ones]}"

async def save(text: str, target: Path, rate: str) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=rate)
    await communicate.save(str(target))


async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    letters = json.loads(LETTERS_PATH.read_text(encoding="utf-8"))
    for index, letter in enumerate(letters, start=1):
        prefix = f"{index:02d}"
        example = letter["words"][0]["word"]
        # Jedan sporiji snimak po lekciji: isti glas i ista rečenica za veliko
        # slovo, dugme „Slušaj ponovo” i primer. Time nema preklapanja dva
        # različita objašnjenja niti veštačkih slogova poput „ba”, „vu” i „go”.
        await save(
            f"Ово је слово {letter['upper']}. {letter['upper']} као {example}.",
            OUTPUT_DIR / f"{prefix}-lesson.mp3",
            LETTER_RATE,
        )
        print(f"{prefix} {letter['upper']} — {example}")

    feedback = {
        "bravo-next-letter.mp3":
            "Браво! Добио си звездицу. Идемо на следеће слово!",
        "bravo-new-letter.mp3":
            "Браво! Научио си ново слово!",
        "bravo-next-number.mp3":
            "Браво! Следећи број!",
        "number-question.mp3":
            "Колико сличица видиш?",
        "bravo-correct.mp3":
            "Браво! Тачан одговор!",
        "bravo-pair.mp3":
            "Браво! Пронађен пар!",
        "bravo-lesson.mp3":
            "Браво! Завршио си своју лекцију!",
        "bravo-three-stars.mp3":
            "Браво! Освојио си три звездице!",
        "bravo-story.mp3":
            "Браво! Разумео си причу.",
        "bravo-story-star.mp3":
            "Браво! Разумео си причу и освојио звездицу!",
        "bravo-story-saved.mp3":
            "Браво! Твоја прича је сачувана.",
        "math-correct.mp3":
            "Тачно! Две и једна су три.",
        "bravo-number-written.mp3":
            "Браво! Лепо си написао број!",
        "word-mama.mp3":
            "Мама.",
        "rhyme-mak-rak.mp3":
            "Мак, рак.",
        "try-again.mp3":
            "Покушај поново."
    }
    for filename, text in feedback.items():
        await save(text, FEEDBACK_DIR / filename, FEEDBACK_RATE)
        print(f"feedback — {filename}")

    for value in range(101):
        await save(
            number_word(value),
            NUMBER_DIR / f"{value:03d}.mp3",
            FEEDBACK_RATE,
        )
        print(f"number — {value:03d} {number_word(value)}")


if __name__ == "__main__":
    asyncio.run(main())
