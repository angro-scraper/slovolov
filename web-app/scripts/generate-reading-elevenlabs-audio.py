"""Generiše lokalne ElevenLabs MP3 resurse za Slovolov modul Citanje.

Skript nikada ne čita ključ iz repozitorijuma i ne šalje ga u logove. Ključ i
ID glasa moraju postojati samo u procesu koji vlasnik lokalno pokrene:

  $env:ELEVENLABS_API_KEY = '...'
  $env:ELEVENLABS_READING_VOICE_ID = '...'
  python scripts/generate-reading-elevenlabs-audio.py --generate --promote

Najpre pravi komplet u izolovanom staging folderu. Tek kada svih 241 MP3
fajlova prođe proveru, --promote ih kopira u javne putanje aplikacije.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = Path(__file__).with_name("reading-elevenlabs-profile.json")
STAGE_ROOT = ROOT / ".reading-audio-stage"
PUBLIC_ROOT = ROOT / "public" / "audio" / "reading"
EXPECTED_COUNT = 241


def load_segments() -> list[tuple[Path, str]]:
    source = Path(__file__).with_name("generate-reading-audio.py")
    specification = importlib.util.spec_from_file_location("reading_segments", source)
    if specification is None or specification.loader is None:
        raise RuntimeError("Ne mogu da učitam spisak segmenata za čitanje.")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    segments = module.all_segments()
    if len(segments) != EXPECTED_COUNT:
        raise RuntimeError(f"Očekivano je {EXPECTED_COUNT} segmenata, pronađeno {len(segments)}.")
    return segments


def load_profile() -> dict[str, object]:
    return json.loads(PROFILE_PATH.read_text(encoding="utf-8"))


def destination_for(source_path: Path) -> Path:
    return STAGE_ROOT / source_path.relative_to(PUBLIC_ROOT)


def require_credentials(profile: dict[str, object]) -> tuple[str, str]:
    safety = profile["safety"]
    voice = profile["voice"]
    assert isinstance(safety, dict) and isinstance(voice, dict)
    api_key = environment_value(str(safety["apiKeyEnvironmentVariable"]))
    voice_id = environment_value(str(voice["voiceIdEnvironmentVariable"]))
    if not api_key or not voice_id:
        raise RuntimeError(
            "Nedostaje ELEVENLABS_API_KEY ili ELEVENLABS_READING_VOICE_ID. "
            "Ključ se ne čuva u repozitorijumu."
        )
    return api_key, voice_id


def environment_value(name: str) -> str:
    """Čita tajnu iz procesa ili Windows korisničkog okruženja, bez ispisa."""
    value = os.environ.get(name, "").strip()
    if value or sys.platform != "win32":
        return value
    try:
        import winreg

        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as key:
            stored, _ = winreg.QueryValueEx(key, name)
            return str(stored).strip()
    except (FileNotFoundError, OSError):
        return ""


def synthesize(*, api_key: str, voice_id: str, profile: dict[str, object], text: str) -> bytes:
    settings = profile["settings"]
    assert isinstance(settings, dict)
    payload = {
        "text": text,
        "model_id": profile["model"],
        "voice_settings": {
            "stability": settings["stability"],
            "similarity_boost": settings["similarityBoost"],
            "style": settings["style"],
            "use_speaker_boost": settings["speakerBoost"],
            "speed": settings["speed"],
        },
    }
    request = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format={settings['outputFormat']}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "xi-api-key": api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"ElevenLabs je vratio HTTP {error.code}: {detail}") from error


def is_valid_mp3(data: bytes) -> bool:
    return len(data) > 1024 and (data.startswith(b"ID3") or data[:2] == b"\xff\xfb")


def write_atomic(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".mp3.partial")
    temporary.write_bytes(data)
    temporary.replace(path)


def generate_all(profile: dict[str, object]) -> None:
    api_key, voice_id = require_credentials(profile)
    segments = load_segments()
    STAGE_ROOT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    for index, (source_path, text) in enumerate(segments, start=1):
        target = destination_for(source_path)
        if target.is_file() and is_valid_mp3(target.read_bytes()):
            print(f"[{index:03d}/{EXPECTED_COUNT}] već postoji {target.relative_to(STAGE_ROOT)}")
        else:
            last_error: Exception | None = None
            for attempt in range(1, 4):
                try:
                    data = synthesize(api_key=api_key, voice_id=voice_id, profile=profile, text=text)
                    if not is_valid_mp3(data):
                        raise RuntimeError("ElevenLabs odgovor nije važeći MP3.")
                    write_atomic(target, data)
                    last_error = None
                    break
                except Exception as error:  # mrežni prekid se bezbedno ponavlja
                    last_error = error
                    if attempt < 3:
                        time.sleep(attempt * 2)
            if last_error is not None:
                raise RuntimeError(f"Generisanje nije uspelo za {target.name}: {last_error}")
            print(f"[{index:03d}/{EXPECTED_COUNT}] sačuvan {target.relative_to(STAGE_ROOT)}")
        body = target.read_bytes()
        manifest.append({
            "path": str(target.relative_to(STAGE_ROOT)).replace("\\", "/"),
            "characters": len(text),
            "sha256": hashlib.sha256(body).hexdigest(),
            "bytes": len(body),
        })
    (STAGE_ROOT / "manifest.json").write_text(
        json.dumps({"profile": profile, "files": manifest}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def validate_stage() -> list[Path]:
    segments = load_segments()
    missing: list[str] = []
    files: list[Path] = []
    for source_path, _ in segments:
        target = destination_for(source_path)
        if not target.is_file() or not is_valid_mp3(target.read_bytes()):
            missing.append(str(target.relative_to(STAGE_ROOT)))
        else:
            files.append(target)
    if missing:
        preview = ", ".join(missing[:5])
        raise RuntimeError(f"Staging nije kompletan: {len(missing)} fajlova nedostaje ili nije MP3 ({preview}).")
    if not (STAGE_ROOT / "manifest.json").is_file():
        raise RuntimeError("Staging nema manifest; pokreni --generate pre --promote.")
    return files


def promote() -> None:
    files = validate_stage()
    for staged in files:
        target = PUBLIC_ROOT / staged.relative_to(STAGE_ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(staged, target)
    print(f"Promovisano {len(files)} lokalnih Ana SRB MP3 fajlova u public/audio/reading.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--promote", action="store_true")
    args = parser.parse_args()
    profile = load_profile()
    segments = load_segments()
    if args.dry_run:
        print(json.dumps({"segments": len(segments), "characters": sum(len(text) for _, text in segments)}, ensure_ascii=False))
    if args.generate:
        generate_all(profile)
    if args.promote:
        promote()
    if not (args.dry_run or args.generate or args.promote):
        parser.error("Izaberi --dry-run, --generate ili --promote.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
