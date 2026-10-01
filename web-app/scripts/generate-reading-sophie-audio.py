"""Generiše Sophie MP3 paket za Čitanje i Moju avanturu.

Korišćen je isti profil kao za `feedback/bravo-correct.mp3`:
`sr-RS-SophieNeural` pri brzini `-18%`. Skripta prvo pravi ceo paket u
izolovanom staging direktorijumu; javni audio se menja samo kada svih 241
snimaka prođe proveru.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import importlib.util
import json
import shutil
import sys
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = Path(__file__).with_name("reading-sophie-profile.json")
PUBLIC_ROOT = ROOT / "public" / "audio" / "reading"
PUBLIC_CATALOG_PATH = PUBLIC_ROOT / "catalog.json"
STAGE_ROOT = ROOT / ".reading-audio-stage-v15-sophie"
EXPECTED_COUNT = 241
VOICE = "sr-RS-SophieNeural"
RATE = "-18%"

SERBIAN_CYRILLIC_TO_LATIN = str.maketrans({
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Ђ": "Đ",
    "Е": "E", "Ж": "Ž", "З": "Z", "И": "I", "Ј": "J", "К": "K",
    "Л": "L", "Љ": "Lj", "М": "M", "Н": "N", "Њ": "Nj", "О": "O",
    "П": "P", "Р": "R", "С": "S", "Т": "T", "Ћ": "Ć", "У": "U",
    "Ф": "F", "Х": "H", "Ц": "C", "Ч": "Č", "Џ": "Dž", "Ш": "Š",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ђ": "đ",
    "е": "e", "ж": "ž", "з": "z", "и": "i", "ј": "j", "к": "k",
    "л": "l", "љ": "lj", "м": "m", "н": "n", "њ": "nj", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t", "ћ": "ć", "у": "u",
    "ф": "f", "х": "h", "ц": "c", "ч": "č", "џ": "dž", "ш": "š",
})


def serbian_tts_text(display_text: str) -> str:
    """Edge-u šalje srpsku latinicu radi pravilnog izgovora."""
    return display_text.translate(SERBIAN_CYRILLIC_TO_LATIN)


def load_segments() -> list[tuple[Path, str]]:
    source = Path(__file__).with_name("generate-reading-audio.py")
    specification = importlib.util.spec_from_file_location("reading_segments", source)
    if specification is None or specification.loader is None:
        raise RuntimeError("Ne mogu da učitam spisak snimaka za čitanje.")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    segments = module.all_segments()
    if len(segments) != EXPECTED_COUNT:
        raise RuntimeError(f"Očekivano je {EXPECTED_COUNT} snimaka, pronađeno je {len(segments)}.")
    return segments


def load_profile() -> dict[str, object]:
    return json.loads(PROFILE_PATH.read_text(encoding="utf-8"))


def fingerprint(profile: dict[str, object], segments: list[tuple[Path, str]]) -> str:
    payload = {
        "profile": profile,
        "segments": [
            {
                "path": str(path.relative_to(PUBLIC_ROOT)).replace("\\", "/"),
                "displayText": text,
                "spokenText": serbian_tts_text(text),
            }
            for path, text in segments
        ],
    }
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def stage_path(source: Path) -> Path:
    return STAGE_ROOT / source.relative_to(PUBLIC_ROOT)


def is_valid_mp3(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size <= 1024:
        return False
    header = path.read_bytes()[:3]
    # Edge TTS može da koristi različite legalne MPEG zaglavlje-bitove
    # (na primer FF F3 umesto ranije korišćenog FF FB), pa proveravamo
    # MPEG sync reč, a ne samo jednu konkretnu varijantu bitrate-a.
    return header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0)


async def synthesize_all(*, force: bool) -> None:
    profile = load_profile()
    segments = load_segments()
    STAGE_ROOT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    for index, (source, display_text) in enumerate(segments, start=1):
        target = stage_path(source)
        spoken_text = serbian_tts_text(display_text)
        if force or not is_valid_mp3(target):
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_suffix(".partial.mp3")
            await edge_tts.Communicate(text=spoken_text, voice=VOICE, rate=RATE).save(str(temporary))
            if not is_valid_mp3(temporary):
                raise RuntimeError(f"Sophie nije napravila važeći MP3: {target.name}")
            temporary.replace(target)
            print(f"[{index:03d}/{EXPECTED_COUNT}] snimljen {target.relative_to(STAGE_ROOT)}")
        else:
            print(f"[{index:03d}/{EXPECTED_COUNT}] postoji {target.relative_to(STAGE_ROOT)}")
        manifest.append({
            "path": str(target.relative_to(STAGE_ROOT)).replace("\\", "/"),
            "displayText": display_text,
            "spokenText": spoken_text,
            "bytes": target.stat().st_size,
        })
    (STAGE_ROOT / "manifest.json").write_text(json.dumps({
        "profile": profile,
        "fingerprint": fingerprint(profile, segments),
        "state": "complete",
        "files": manifest,
    }, ensure_ascii=False, indent=2), encoding="utf-8")


def validate_stage() -> list[Path]:
    profile = load_profile()
    segments = load_segments()
    manifest_path = STAGE_ROOT / "manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError("Staging nema manifest; prvo pokreni --generate.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("state") != "complete" or manifest.get("fingerprint") != fingerprint(profile, segments):
        raise RuntimeError("Staging nije potpun Sophie paket za trenutni katalog.")
    files = [stage_path(source) for source, _ in segments]
    invalid = [str(path.relative_to(STAGE_ROOT)) for path in files if not is_valid_mp3(path)]
    if invalid:
        raise RuntimeError(f"Staging ima {len(invalid)} nevažećih MP3 fajlova: {', '.join(invalid[:5])}")
    return files


def promote() -> None:
    profile = load_profile()
    segments = load_segments()
    files = validate_stage()
    for staged in files:
        target = PUBLIC_ROOT / staged.relative_to(STAGE_ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(staged, target)
    PUBLIC_CATALOG_PATH.write_text(json.dumps({
        "profile": profile,
        "fingerprint": fingerprint(profile, segments),
        "segments": [
            {
                "path": str(path.relative_to(PUBLIC_ROOT)).replace("\\", "/"),
                "displayText": text,
                "spokenText": serbian_tts_text(text),
            }
            for path, text in segments
        ],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Objavljen je lokalni Sophie paket: {len(files)} MP3 snimaka.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Proverava katalog bez mreže.")
    parser.add_argument("--generate", action="store_true", help="Pravi Sophie staging paket.")
    parser.add_argument("--promote", action="store_true", help="Prebacuje provereni staging u public/audio/reading.")
    parser.add_argument("--force", action="store_true", help="Ponovo snima i postojeće staging fajlove.")
    args = parser.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    segments = load_segments()
    if args.dry_run:
        print(json.dumps({"segments": len(segments), "voice": VOICE, "rate": RATE}, ensure_ascii=False))
    if args.generate:
        asyncio.run(synthesize_all(force=args.force))
    if args.promote:
        promote()
    if not (args.dry_run or args.generate or args.promote):
        parser.error("Izaberi --dry-run, --generate ili --promote.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
