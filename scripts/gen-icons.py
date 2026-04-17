#!/usr/bin/env python3
"""Generate placeholder PWA icons without external deps.

Produces:
  public/icon-192.png
  public/icon-512.png
  public/apple-touch-icon.png (180x180)
  public/favicon.ico  (32x32 PNG-in-ICO)

Icons are a flat indigo square with a white "M" pictogram.
Replace with real artwork whenever you like.
"""

from __future__ import annotations

import os
import struct
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
PUB = HERE / "public"
PUB.mkdir(parents=True, exist_ok=True)

BG = (79, 70, 229)        # indigo-600
FG = (255, 255, 255)      # white


def draw_m(width: int, height: int) -> bytes:
    """Return raw RGBA bytes for a (width x height) icon with a white 'M' on indigo."""
    # 'M' built from a few rectangles.
    inset_x = width * 0.22
    inset_y = height * 0.22
    m_w = width - 2 * inset_x
    m_h = height - 2 * inset_y
    stroke = m_w * 0.18

    left_bar_x0 = inset_x
    left_bar_x1 = inset_x + stroke
    right_bar_x0 = inset_x + m_w - stroke
    right_bar_x1 = inset_x + m_w

    top_y = inset_y
    bot_y = inset_y + m_h

    apex_x = inset_x + m_w / 2

    def in_bar(x: float, y: float, x0: float, x1: float) -> bool:
        return x0 <= x <= x1 and top_y <= y <= bot_y

    def in_diag(x: float, y: float, x_start: float, x_end: float) -> bool:
        if y < top_y or y > top_y + m_h * 0.55:
            return False
        t = (y - top_y) / (m_h * 0.55)
        cx = x_start + (x_end - x_start) * t
        return abs(x - cx) <= stroke * 0.7

    rows = bytearray()
    for py in range(height):
        y = py + 0.5
        row = bytearray()
        row.append(0)  # PNG filter byte: None
        for px in range(width):
            x = px + 0.5
            is_fg = (
                in_bar(x, y, left_bar_x0, left_bar_x1)
                or in_bar(x, y, right_bar_x0, right_bar_x1)
                or in_diag(x, y, left_bar_x1, apex_x)
                or in_diag(x, y, right_bar_x0, apex_x)
            )
            r, g, b = FG if is_fg else BG
            row += bytes((r, g, b, 255))
        rows += row
    return bytes(rows)


def write_png(path: Path, width: int, height: int, raw_rgba_with_filter: bytes) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)  # RGBA, 8-bit
    idat = zlib.compress(raw_rgba_with_filter, 9)
    path.write_bytes(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def write_ico(path: Path, png_bytes: bytes, width: int, height: int) -> None:
    # ICO directory with a single embedded PNG image.
    header = struct.pack("<HHH", 0, 1, 1)
    w = 0 if width >= 256 else width
    h = 0 if height >= 256 else height
    entry = struct.pack(
        "<BBBBHHII",
        w,
        h,
        0,
        0,
        1,
        32,
        len(png_bytes),
        6 + 16,  # offset to PNG data
    )
    path.write_bytes(header + entry + png_bytes)


def main() -> None:
    for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")]:
        pixels = draw_m(size, size)
        write_png(PUB / name, size, size, pixels)
        print("wrote", PUB / name)

    # favicon.ico (32x32 PNG inside ICO)
    size = 32
    pixels = draw_m(size, size)
    tmp = PUB / "_favicon.png"
    write_png(tmp, size, size, pixels)
    png_bytes = tmp.read_bytes()
    os.remove(tmp)
    write_ico(PUB / "favicon.ico", png_bytes, size, size)
    print("wrote", PUB / "favicon.ico")


if __name__ == "__main__":
    main()
