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


# Windows terminali često podrazumevano koriste cp1252, koji ne može da ispiše
# ćirilični katalog. Katalog i dijagnostika zato uvek koriste UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = Path(__file__).with_name("reading-elevenlabs-profile.json")
# Nikada ne mešamo novi Ana paket sa starim Edge/Sophie staging fajlovima.
STAGE_ROOT = ROOT / ".reading-audio-stage-v14-serbian-latin"
PUBLIC_ROOT = ROOT / "public" / "audio" / "reading"
PUBLIC_CATALOG_PATH = PUBLIC_ROOT / "catalog.json"
PREVIEW_ROOT = ROOT / ".reading-pronunciation-preview"
EXPECTED_COUNT = 241

# Kratki izolovani zapisi moraju biti prosleđeni u prirodnom srpskom obliku.
# Velika slova ElevenLabs povremeno tumači kao skraćenice i zato daju
# neprirodan ili pogrešan izgovor iako UI ispravno prikazuje velika slova.
PRONUNCIATION_PREVIEWS = (
    ("slog-ma", "ma"),
    ("slog-lju", "lju"),
    ("rec-sova", "sova"),
    ("rec-hleb", "hleb"),
    ("rec-knjiga", "knjiga"),
    ("rec-pcela", "pčela"),
)

HARD_PRONUNCIATION_PREVIEWS = (
    ("tesko-djak", "đak"),
    ("tesko-dzemper", "džemper"),
    ("tesko-cirilica", "ćirilica"),
    ("tesko-ljuljaska", "ljuljaška"),
    ("tesko-njiva", "njiva"),
    ("tesko-zdrebe", "ždrebe"),
    ("recenica-lj-nj", "Ljuljaška se njiše pored cveća."),
    ("recenica-dj-dz", "Đak čita priču o džemperu."),
    ("recenica-pc-c-z", "Pčela Žuća leti iznad cveća."),
)

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
    """Pretvara UI ćirilicu u srpsku latinicu koju Ana pravilno izgovara."""
    return display_text.translate(SERBIAN_CYRILLIC_TO_LATIN)


def fingerprint(profile: dict[str, object], segments: list[tuple[Path, str]]) -> str:
    """Vezivanje staging paketa za tačan profil i vidljivi tekst."""
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
    return hashlib.sha256(
        json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()


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
        "apply_text_normalization": "on",
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


def write_manifest(*, profile: dict[str, object], content_fingerprint: str,
                   files: list[dict[str, object]], state: str) -> None:
    (STAGE_ROOT / "manifest.json").write_text(
        json.dumps({
            "profile": profile,
            "fingerprint": content_fingerprint,
            "state": state,
            "files": files,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def generate_all(profile: dict[str, object], *, force: bool = False) -> None:
    api_key, voice_id = require_credentials(profile)
    segments = load_segments()
    expected_fingerprint = fingerprint(profile, segments)
    STAGE_ROOT.mkdir(parents=True, exist_ok=True)
    existing_manifest: dict[str, object] = {}
    manifest_path = STAGE_ROOT / "manifest.json"
    if manifest_path.is_file():
        try:
            existing_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing_manifest = {}
    old_entries = {
        str(entry.get("path")): entry
        for entry in existing_manifest.get("files", [])
        if isinstance(entry, dict)
    }
    can_reuse_profile = existing_manifest.get("profile") == profile
    # Manifest pamti tačan tekst poslat Ani. Pri promeni jedne rečenice
    # bezbedno se zadržavaju samo fajlovi istog profila i identičnog spokenText.
    # Tako mali jezički ispravak ne troši kredite na ostalih 240 snimaka.
    write_manifest(
        profile=profile,
        content_fingerprint=expected_fingerprint,
        files=[],
        state="in-progress",
    )
    manifest: list[dict[str, object]] = []
    for index, (source_path, display_text) in enumerate(segments, start=1):
        spoken_text = serbian_tts_text(display_text)
        target = destination_for(source_path)
        relative_path = str(target.relative_to(STAGE_ROOT)).replace("\\", "/")
        old_entry = old_entries.get(relative_path, {})
        can_reuse_file = (
            not force
            and can_reuse_profile
            and old_entry.get("spokenText") == spoken_text
            and target.is_file()
            and is_valid_mp3(target.read_bytes())
        )
        if can_reuse_file:
            print(f"[{index:03d}/{EXPECTED_COUNT}] exists {target.relative_to(STAGE_ROOT)}")
        else:
            last_error: Exception | None = None
            for attempt in range(1, 4):
                try:
                    data = synthesize(
                        api_key=api_key,
                        voice_id=voice_id,
                        profile=profile,
                        text=spoken_text,
                    )
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
            print(f"[{index:03d}/{EXPECTED_COUNT}] saved {target.relative_to(STAGE_ROOT)}")
        body = target.read_bytes()
        manifest.append({
            "path": str(target.relative_to(STAGE_ROOT)).replace("\\", "/"),
            "displayText": display_text,
            "spokenText": spoken_text,
            "textSha256": hashlib.sha256(spoken_text.encode("utf-8")).hexdigest(),
            "characters": len(spoken_text),
            "sha256": hashlib.sha256(body).hexdigest(),
            "bytes": len(body),
        })
    write_manifest(
        profile=profile,
        content_fingerprint=expected_fingerprint,
        files=manifest,
        state="complete",
    )


def validate_stage(profile: dict[str, object]) -> list[Path]:
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
    manifest_path = STAGE_ROOT / "manifest.json"
    if not manifest_path.is_file():
        raise RuntimeError("Staging nema manifest; pokreni --generate pre --promote.")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("fingerprint") != fingerprint(profile, segments) or manifest.get("state") != "complete":
        raise RuntimeError(
            "Staging nije iz istog profila i istog srpsko-latiničnog TTS kataloga. "
            "Pokreni --generate --force pre --promote."
        )
    return files


def promote(profile: dict[str, object]) -> None:
    files = validate_stage(profile)
    for staged in files:
        target = PUBLIC_ROOT / staged.relative_to(STAGE_ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(staged, target)
    segments = load_segments()
    PUBLIC_CATALOG_PATH.write_text(
        json.dumps(
            {
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
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Promoted {len(files)} local Ana SRB MP3 files into public/audio/reading.")


def generate_pronunciation_previews(profile: dict[str, object]) -> None:
    """Pravi mali paket za ljudsku proveru pre trošenja kredita na ceo katalog."""
    api_key, voice_id = require_credentials(profile)
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, str]] = []
    for slug, text in PRONUNCIATION_PREVIEWS:
        target = PREVIEW_ROOT / f"{slug}.mp3"
        data = synthesize(api_key=api_key, voice_id=voice_id, profile=profile, text=text)
        if not is_valid_mp3(data):
            raise RuntimeError(f"ElevenLabs odgovor nije važeći MP3 za {slug}.")
        write_atomic(target, data)
        manifest.append({"path": target.name, "text": text})
        print(f"preview — {target.name}: {text}")
    (PREVIEW_ROOT / "catalog.json").write_text(
        json.dumps({"profile": profile, "segments": manifest}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def generate_hard_pronunciation_previews(profile: dict[str, object]) -> None:
    """Pravi teže srpske uzorke za slušnu proveru svih posebnih glasova."""
    api_key, voice_id = require_credentials(profile)
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    for slug, text in HARD_PRONUNCIATION_PREVIEWS:
        target = PREVIEW_ROOT / f"{slug}.mp3"
        data = synthesize(api_key=api_key, voice_id=voice_id, profile=profile, text=text)
        if not is_valid_mp3(data):
            raise RuntimeError(f"ElevenLabs odgovor nije važeći MP3 za {slug}.")
        write_atomic(target, data)
        print(f"hard preview — {target.name}: {text}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", action="store_true", help="Ispisuje proverljivi katalog bez mreže.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--promote", action="store_true")
    parser.add_argument("--force", action="store_true", help="Ponovo snima ceo staging paket.")
    parser.add_argument(
        "--pronunciation-preview",
        action="store_true",
        help="Pravi šest malih uzoraka prirodnog srpskog izgovora bez promocije.",
    )
    parser.add_argument(
        "--hard-pronunciation-preview",
        action="store_true",
        help="Pravi teže srpske uzorke sa đ, dž, ć, č, lj, nj i ž.",
    )
    args = parser.parse_args()
    profile = load_profile()
    segments = load_segments()
    if args.catalog:
        print(json.dumps({
            "segments": [
                {
                    "path": str(path.relative_to(PUBLIC_ROOT)).replace("\\", "/"),
                    "displayText": text,
                    "spokenText": serbian_tts_text(text),
                }
                for path, text in segments
            ],
            "fingerprint": fingerprint(profile, segments),
        }, ensure_ascii=False))
    if args.dry_run:
        print(json.dumps({
            "segments": len(segments),
            "characters": sum(len(serbian_tts_text(text)) for _, text in segments),
        }, ensure_ascii=False))
    if args.generate:
        generate_all(profile, force=args.force)
    if args.promote:
        promote(profile)
    if args.pronunciation_preview:
        generate_pronunciation_previews(profile)
    if args.hard_pronunciation_preview:
        generate_hard_pronunciation_previews(profile)
    if not (
        args.catalog
        or args.dry_run
        or args.generate
        or args.promote
        or args.pronunciation_preview
        or args.hard_pronunciation_preview
    ):
        parser.error(
            "Izaberi --catalog, --dry-run, --generate, --promote, "
            "--pronunciation-preview ili --hard-pronunciation-preview."
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
