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


def save_adaptive_foreground(
    source: Image.Image,
    target: Path,
    size: int,
) -> None:
    """Sačuvaj logo unutar Android adaptive-icon bezbedne zone."""
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    artwork_size = round(size * 0.72)
    artwork = source.resize(
        (artwork_size, artwork_size),
        Image.Resampling.LANCZOS,
    ).convert("RGBA")
    offset = (size - artwork_size) // 2
    canvas.alpha_composite(artwork, (offset, offset))
    canvas.save(target, format="PNG", optimize=True)


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    outputs = {
        ROOT / "public" / "icons" / "favicon-32.png": 32,
        ROOT / "public" / "icons" / "apple-touch-icon.png": 180,
        ROOT / "public" / "icons" / "slovolov-icon-192.png": 192,
        ROOT / "public" / "icons" / "slovolov-icon-512.png": 512,
        ROOT / "store-listing" / "google-play" / "assets" / "app-icon-512.png": 512,
    }
    ios_icon_dir = (
        ROOT
        / "ios"
        / "App"
        / "App"
        / "Assets.xcassets"
        / "AppIcon.appiconset"
    )
    ios_sizes = {
        "AppIcon-20.png": 20,
        "AppIcon-20@2x.png": 40,
        "AppIcon-20@3x.png": 60,
        "AppIcon-29.png": 29,
        "AppIcon-29@2x.png": 58,
        "AppIcon-29@3x.png": 87,
        "AppIcon-40.png": 40,
        "AppIcon-40@2x.png": 80,
        "AppIcon-40@3x.png": 120,
        "AppIcon-60@2x.png": 120,
        "AppIcon-60@3x.png": 180,
        "AppIcon-76.png": 76,
        "AppIcon-76@2x.png": 152,
        "AppIcon-83.5@2x.png": 167,
        "AppIcon-512@2x.png": 1024,
    }
    for filename, size in ios_sizes.items():
        outputs[ios_icon_dir / filename] = size

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

    for target, size in outputs.items():
        save_icon(source, target, size)

    adaptive_sizes = {
        "mdpi": 108,
        "hdpi": 162,
        "xhdpi": 216,
        "xxhdpi": 324,
        "xxxhdpi": 432,
    }
    for density, size in adaptive_sizes.items():
        resource_dir = (
            ROOT
            / "android"
            / "app"
            / "src"
            / "main"
            / "res"
            / f"mipmap-{density}"
        )
        save_adaptive_foreground(
            source,
            resource_dir / "ic_launcher_foreground.png",
            size,
        )

    print(
        f"Napravljeno {len(outputs) + len(adaptive_sizes)} Slovolov ikona "
        f"iz {SOURCE}."
    )


if __name__ == "__main__":
    main()
