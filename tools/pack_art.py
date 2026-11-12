#!/usr/bin/env python3
"""コハルの絵とスチルを、ゲームで読む形に整える。

  python3 tools/pack_art.py

- assets/koharu-walk-atlas.png（緑背景）→ assets/koharu-walk.png
  12コマの背景を抜き、足元を下端・中央にそろえた同じ大きさのセルへ並べ直す。
- assets/koharu-town.png（マゼンタ背景）→ assets/koharu-town-cut.png
- assets/stills/*.png → assets/stills/web/*.webp（幅1280。原本は残す）

ブラウザ側で画素を読まずに済むよう、背景抜きはここで済ませる
（index.html を直接開いた時、画像の画素は読み出せないため）。
"""
import glob, os
import numpy as np
from PIL import Image

A = os.path.join(os.path.dirname(__file__), '..', 'assets')


def key_out(img, kind):
    d = np.asarray(img.convert('RGBA')).astype(np.int32).copy()
    r, g, b = d[..., 0], d[..., 1], d[..., 2]
    if kind == 'green':
        strength = g - np.maximum(r, b)          # 緑がどれだけ勝っているか
        d[..., 1] = np.where(strength > 0, np.minimum(g, np.maximum(r, b) + 6), g)  # 縁の緑かぶりを抑える
    else:
        strength = np.minimum(r, b) - g
        spill = strength > 0
        d[..., 0] = np.where(spill, np.minimum(r, g + 40), r)
        d[..., 2] = np.where(spill, np.minimum(b, g + 40), b)
    alpha = np.clip(255 - (strength - 28) * 255 / 42, 0, 255)
    d[..., 3] = np.minimum(d[..., 3], alpha)
    return Image.fromarray(d.astype(np.uint8), 'RGBA')


def trim(img, threshold=24):
    a = np.asarray(img)[..., 3] > threshold
    ys, xs = np.where(a)
    return img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def walk():
    src = Image.open(os.path.join(A, 'koharu-walk-atlas.png'))
    cw, ch = src.width // 3, src.height // 4
    frames = [trim(key_out(src.crop((c * cw + 3, r * ch + 3, (c + 1) * cw - 3, (r + 1) * ch - 3)), 'green')) for r in range(4) for c in range(3)]
    tall = max(f.height for f in frames)
    scale = 240 / tall                              # トウマ（約262）より少し低い背丈
    cell_w, cell_h = 220, 250
    out = Image.new('RGBA', (cell_w * 3, cell_h * 4))
    for i, f in enumerate(frames):
        f = f.resize((round(f.width * scale), round(f.height * scale)), Image.LANCZOS)
        out.paste(f, ((i % 3) * cell_w + (cell_w - f.width) // 2, (i // 3) * cell_h + cell_h - f.height))
    out.save(os.path.join(A, 'koharu-walk.png'), optimize=True)
    print('koharu-walk.png', out.size)


def town():
    f = trim(key_out(Image.open(os.path.join(A, 'koharu-town.png')), 'magenta'))
    f = f.resize((round(f.width * 420 / f.height), 420), Image.LANCZOS)
    f.save(os.path.join(A, 'koharu-town-cut.png'), optimize=True)
    print('koharu-town-cut.png', f.size)


def stills():
    out = os.path.join(A, 'stills', 'web')
    os.makedirs(out, exist_ok=True)
    for path in sorted(glob.glob(os.path.join(A, 'stills', '*.png'))):
        img = Image.open(path).convert('RGB')
        img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
        name = os.path.splitext(os.path.basename(path))[0]
        img.save(os.path.join(out, name + '.webp'), quality=84, method=6)
        img.resize((400, round(img.height * 400 / img.width)), Image.LANCZOS).save(os.path.join(out, name + '-thumb.webp'), quality=78, method=6)
    print('stills', len(os.listdir(out)), 'files', sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) // 1024, 'KB')


if __name__ == '__main__':
    walk(); town(); stills()
