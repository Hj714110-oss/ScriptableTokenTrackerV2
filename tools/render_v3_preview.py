#!/usr/bin/env python3
"""Render the public V3 iPhone mockup with fictional data.

Requires rsvg-convert and ImageMagick (magick). The checked-in PNG is already
rendered; this helper is only for maintainers who want to regenerate it.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREEN = ROOT / "tools" / "v3-sanitized-screen.svg"
FRAME = ROOT / "tools" / "v3-iphone-frame.svg"
DEFAULT_OUTPUT = ROOT / "assets" / "v3-interface-overview.png"


def run(args: list[str]) -> None:
    subprocess.run(args, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    options = parser.parse_args()
    for binary in ("rsvg-convert", "magick"):
        if shutil.which(binary) is None:
            raise SystemExit(f"missing renderer: {binary}")
    if not SCREEN.exists() or not FRAME.exists():
        raise SystemExit("missing checked-in mockup sources")
    output = options.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        temp = Path(directory)
        screen_png = temp / "screen.png"
        frame_png = temp / "frame.png"
        run(["rsvg-convert", str(SCREEN), "-o", str(screen_png)])
        run(["rsvg-convert", str(FRAME), "-o", str(frame_png)])
        run(["magick", str(frame_png), str(screen_png), "-geometry", "+270+132", "-compose", "over", "-composite", str(output)])
    print(output)


if __name__ == "__main__":
    main()
