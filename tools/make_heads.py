"""Вырезка голов для морд Spiral Impact.

Берёт картинки из art/source/, нейросетью убирает фон (rembg), оставляет только голову
(эллипс вокруг лица, без шеи и плеч) и сохраняет спрайты высотой 360 px в art/heads/.
Печатает параметры для SKINS в index.html: cx, cy — центр лица, fw — ширина лица (px).

Установка:  pip install rembg pillow numpy
Запуск:     python tools/make_heads.py
Готовые .webp встраиваются в index.html (FACE_DATA) в base64.
"""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC, OUT = os.path.join(ROOT, 'art', 'source'), os.path.join(ROOT, 'art', 'heads')
H = 360

# имя: (файл, центр лица x, уровень глаз y, подбородок y, полуширина сверху, полуширина снизу) — в долях картинки
HEADS = {
    'kiber':      ('references/kiber.webp',     .46, .37, .61, .36, .30),
    'elfiyka':    ('references/elfiyka.png',    .575, .40, .68, .31, .14),
    'yashcher':   ('references/yashcher.webp',  .52, .40, .57, .45, .33),
    'cherep':     ('references/cherep.webp',    .50, .42, .58, .36, .20),
    'fioletoviy': ('orcs/orc-166.png',          .60, .38, .57, .30, .17),
    'klykach':    ('orcs/orc-169.png',          .55, .36, .60, .45, .25),
    'rogach':     ('orcs/orc-173.png',          .48, .31, .56, .32, .17),
    'orchiha':    ('orcs/orc-201.png',          .60, .37, .56, .28, .16),
    'borodach':   ('orcs/orc-204.png',          .52, .37, .76, .42, .25),
}
SOFT = {'kiber'}  # светлые волосы на светлом фоне — мягче порог прозрачности


def hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h, (mx - mn) / (mx + 1e-6), mx


def main():
    os.makedirs(OUT, exist_ok=True)
    session = new_session('isnet-general-use')
    meta = {}
    for name, (f, cx, ey, chin, rxT, rxB) in HEADS.items():
        cut = remove(Image.open(os.path.join(SRC, f)).convert('RGB'), session=session)
        a = np.asarray(cut.convert('RGBA')).astype(np.float32) / 255
        h, w = a.shape[:2]
        X, Y = np.meshgrid(np.arange(w) / w, np.arange(h) / h)
        top = ((X - cx) / rxT) ** 2 + ((Y - ey) / ey) ** 2 < 1
        bot = ((X - cx) / rxB) ** 2 + ((Y - ey) / (chin - ey)) ** 2 < 1
        m = Image.fromarray(np.where(Y < ey, top, bot).astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(w * 0.012))
        lo = 0.12 if name in SOFT else 0.3
        a[..., 3] = np.clip((a[..., 3] - lo) / 0.45, 0, 1) * (np.asarray(m).astype(np.float32) / 255)
        ys = np.where((a[..., 3] > 0.05).any(1))[0]; xs = np.where((a[..., 3] > 0.05).any(0))[0]
        x0, x1, y0, y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
        a = a[y0:y1, x0:x1]; k = H / a.shape[0]; W = round(a.shape[1] * k)
        img = Image.fromarray((a * 255).astype(np.uint8), 'RGBA').resize((W, H), Image.LANCZOS)
        img.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
        meta[name] = dict(cx=round((cx * w - x0) * k), cy=round(((ey + 0.3 * (chin - ey)) * h - y0) * k), fw=round(2 * rxB * w * k * 0.95))
        print(name, meta[name])
    # свечение черепа: голубые части отдельной картинкой
    a = np.asarray(Image.open(os.path.join(OUT, 'cherep.webp')).convert('RGBA')).astype(np.float32) / 255
    hh, s, v = hsv(a); g = a.copy()
    g[..., 3] = ((hh > 0.45) & (hh < 0.6) & (s > 0.35) & (v > 0.45)) * a[..., 3]
    Image.fromarray((g * 255).astype(np.uint8), 'RGBA').filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(OUT, 'cherep_glow.webp'), 'WEBP', quality=88)
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
