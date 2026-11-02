"""Сборка игры в один HTML-файл (для страницы-артефакта или отправки одним файлом).

В репозитории игра состоит из index.html + armory.js + horde.js + ffa.js + abilities.js + touch.js + картинки в art/ (так её отдаёт GitHub Pages).
Скрипт встраивает скрипты и картинки внутрь одного файла:  python tools/build_single.py  [выходной.html]
"""
import base64, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'spiral-impact.html')
s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
for js in ('armory.js', 'horde.js', 'ffa.js', 'abilities.js', 'touch.js'):
    tag = '<script src="%s"></script>' % js
    code = open(os.path.join(ROOT, js), encoding='utf-8').read().replace('</script', '<\\/script')
    s = s.replace(tag, '<script>\n' + code + '\n</script>')
def uri(path):
    return 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(ROOT, path), 'rb').read()).decode()
files = ['art/%s/%s' % (d, f) for d in ('heads', 'textures', 'weapons', 'monsters') for f in sorted(os.listdir(os.path.join(ROOT, 'art', d))) if f.endswith('.webp')]
inline = ','.join("'%s':'%s'" % (p, uri(p)) for p in files)
s = s.replace("<script>\n'use strict';", "<script>window.__INLINE={%s};</script>\n<script>\n'use strict';" % inline, 1)
s = s.replace('src="art/logos/logo-main.webp"', 'src="%s"' % uri('art/logos/logo-main.webp'))
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(s)
print(out, len(s) // 1024, 'КБ')
