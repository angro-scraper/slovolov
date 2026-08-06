"""Generiše lokalne srpske snimke svih 30 slova preko Edge TTS-a."""

from __future__ import annotations

import asyncio
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
LETTERS_PATH = ROOT / "src" / "data" / "letters.json"
OUTPUT_DIR = ROOT / "public" / "audio" / "letters"
FEEDBACK_DIR = ROOT / "public" / "audio" / "feedback"
NUMBER_DIR = ROOT / "public" / "audio" / "numbers"
REFERENCE_AUDIO = ROOT / "assets" / "audio-source" / "serbian-alphabet-pronunciation.ogg"
VOICE = "sr-RS-SophieNeural"
LETTER_RATE = "-28%"
FEEDBACK_RATE = "-18%"

# Vremenski isečci iz referentnog snimka srpske azbuke. Svaki par je
# (početak, trajanje) za odgovarajući red u letters.json. Referenca i
# atribucija su dokumentovane u docs/AUDIO_ATTRIBUTION.md.
REFERENCE_SEGMENTS = [
    (0.60, 0.54), (1.62, 0.49), (2.87, 0.49), (3.88, 0.46), (4.96, 0.49),
    (6.02, 0.54), (6.98, 0.46), (7.72, 0.51), (8.65, 0.57), (9.98, 0.46),
    (10.94, 0.49), (12.14, 0.36), (13.06, 0.47), (14.12, 0.50), (14.92, 0.48),
    (16.11, 0.55), (17.39, 0.53), (18.31, 0.43), (19.52, 0.29), (20.30, 0.39),
    (21.30, 0.52), (22.69, 0.32), (23.86, 0.37), (25.05, 0.47), (25.93, 0.41),
    (27.06, 0.42), (27.97, 0.43), (29.16, 0.37), (30.08, 0.51), (31.23, 0.45),
]

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


def run_ffmpeg(*args: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args],
        check=True,
    )


async def save_letter_lesson(
    *, index: int, letter: dict[str, object], target: Path
) -> None:
    """Spaja ženski Slovolov uvod/završetak sa fonetskim snimkom slova."""
    if not REFERENCE_AUDIO.is_file():
        raise FileNotFoundError(f"Nedostaje referentni snimak: {REFERENCE_AUDIO}")

    start, duration = REFERENCE_SEGMENTS[index]
    example = str(letter["words"][0]["word"])
    with tempfile.TemporaryDirectory(prefix="slovolov-letter-") as temporary:
        temp = Path(temporary)
        intro = temp / "intro.mp3"
        letter_clip = temp / "letter.mp3"
        outro = temp / "outro.mp3"
        manifest = temp / "concat.txt"
        await save("Ово је слово", intro, LETTER_RATE)
        await save(f"као {example}.", outro, LETTER_RATE)
        run_ffmpeg(
            "-ss", f"{start:.3f}", "-t", f"{duration:.3f}",
            "-i", str(REFERENCE_AUDIO),
            "-af", "afade=t=in:st=0:d=0.02,afade=t=out:st=0.40:d=0.04",
            "-c:a", "libmp3lame", "-b:a", "128k", str(letter_clip),
        )
        manifest.write_text(
            "\n".join(f"file '{path.as_posix()}'" for path in (intro, letter_clip, outro)),
            encoding="utf-8",
        )
        run_ffmpeg(
            "-f", "concat", "-safe", "0", "-i", str(manifest),
            "-c:a", "libmp3lame", "-b:a", "128k", str(target),
        )


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--letter",
        help="Generiše samo lokalni snimak za navedeno ćirilično slovo.",
    )
    parser.add_argument(
        "--all-content",
        action="store_true",
        help="Pored slova obnavlja i audio brojeva i povratnih poruka.",
    )
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    letters = json.loads(LETTERS_PATH.read_text(encoding="utf-8"))
    for zero_index, letter in enumerate(letters):
        index = zero_index + 1
        if args.letter and letter["upper"] != args.letter:
            continue
        prefix = f"{index:02d}"
        await save_letter_lesson(
            index=zero_index,
            letter=letter,
            target=OUTPUT_DIR / f"{prefix}-lesson.mp3",
        )
        print(f"{prefix} {letter['upper']} — {letter['words'][0]['word']}")

    if args.letter or not args.all_content:
        return

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
