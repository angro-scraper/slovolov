"""Napravi PWA, Android, iOS i store ikone iz jednog Slovolov master PNG-a."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "icons" / "slovolov-app-icon-v2.png"


def save_icon(source: Image.Image, target: Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    source.resize((size, size), Image.Resampling.LANCZOS).convert("RGB").save(
        target,
        format="PNG",
        optimize=True,
    )


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    outputs = {
        ROOT / "public" / "icons" / "slovolov-icon-192.png": 192,
        ROOT / "public" / "icons" / "slovolov-icon-512.png": 512,
        ROOT / "store-listing" / "google-play" / "assets" / "app-icon-512.png": 512,
        ROOT
        / "ios"
        / "App"
        / "App"
        / "Assets.xcassets"
        / "AppIcon.appiconset"
        / "AppIcon-512@2x.png": 1024,
    }
    android_sizes = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for density, size in android_sizes.items():
        resource_dir = ROOT / "android" / "app" / "src" / "main" / "res" / f"mipmap-{density}"
        outputs[resource_dir / "ic_launcher.png"] = size
        outputs[resource_dir / "ic_launcher_round.png"] = size
        outputs[resource_dir / "ic_launcher_foreground.png"] = size

    for target, size in outputs.items():
        save_icon(source, target, size)

    print(f"Napravljeno {len(outputs)} Slovolov ikona iz {SOURCE}.")


if __name__ == "__main__":
    main()
