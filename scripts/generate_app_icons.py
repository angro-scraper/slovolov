"""Generiše platformske ikone iz jednog odobrenog 1024px izvora."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "branding" / "slovoigra-icon-1024.png"

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

IOS_SIZES = {
    "Icon-App-20x20@1x.png": 20,
    "Icon-App-20x20@2x.png": 40,
    "Icon-App-20x20@3x.png": 60,
    "Icon-App-29x29@1x.png": 29,
    "Icon-App-29x29@2x.png": 58,
    "Icon-App-29x29@3x.png": 87,
    "Icon-App-40x40@1x.png": 40,
    "Icon-App-40x40@2x.png": 80,
    "Icon-App-40x40@3x.png": 120,
    "Icon-App-60x60@2x.png": 120,
    "Icon-App-60x60@3x.png": 180,
    "Icon-App-76x76@1x.png": 76,
    "Icon-App-76x76@2x.png": 152,
    "Icon-App-83.5x83.5@2x.png": 167,
    "Icon-App-1024x1024@1x.png": 1024,
}


def save_square(source: Image.Image, target: Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    source.resize((size, size), Image.Resampling.LANCZOS).save(
        target,
        format="PNG",
        optimize=True,
    )


def main() -> None:
    with Image.open(SOURCE).convert("RGB") as source:
        for folder, size in ANDROID_SIZES.items():
            save_square(
                source,
                ROOT
                / "android"
                / "app"
                / "src"
                / "main"
                / "res"
                / folder
                / "ic_launcher.png",
                size,
            )
        ios_root = (
            ROOT
            / "ios"
            / "Runner"
            / "Assets.xcassets"
            / "AppIcon.appiconset"
        )
        for filename, size in IOS_SIZES.items():
            save_square(source, ios_root / filename, size)


if __name__ == "__main__":
    main()
