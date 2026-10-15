#!/usr/bin/env python3
"""Draw the glyph JSON from make-font.mjs as a TrueType font: <out>.ttf,
<out>.woff and <out>.woff2.

One font pixel = 125 units and the em is 8 pixels (7 above the baseline, 1
below), so at font-size 8n px every font pixel is exactly n CSS px. Lower
case maps to the capitals. A glyph with more than seven rows (Å's ring,
Ä's dots) reaches into the em's top pixel; the win ascent covers it so it is
not clipped, while the typo metrics keep line heights on the 8 px grid."""
import json
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

src, dst = sys.argv[1], sys.argv[2]
glyphs = json.load(open(src, encoding='utf-8'))
U = 125


def draw(rows):
    pen = TTGlyphPen(None)
    lift = len(rows) - 7  # rows above the cap height
    for gy, row in enumerate(rows):
        gy -= lift
        x = 0
        while x < len(row):
            if row[x] != '#':
                x += 1
                continue
            s = x
            while x < len(row) and row[x] == '#':
                x += 1
            top = (7 - gy) * U
            bot = top - U
            pen.moveTo((s * U, bot))
            pen.lineTo((s * U, top))
            pen.lineTo((x * U, top))
            pen.lineTo((x * U, bot))
            pen.closePath()
    return pen.glyph()


names, cmap, widths, outlines = ['.notdef'], {}, {'.notdef': 6 * U}, {}
# .notdef: a hollow box, so a missing character is visible.
box = ['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####']
outlines['.notdef'] = draw(box)
for i, (ch, rows) in enumerate(glyphs.items()):
    name = f'g{i}'
    names.append(name)
    outlines[name] = draw(rows)
    widths[name] = (len(rows[0]) + 1) * U
    cmap[ord(ch)] = name
    low = ch.lower()
    if ch.isalpha() and low != ch and len(low) == 1 and ord(low) not in cmap:
        cmap[ord(low)] = name

fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(names)
fb.setupCharacterMap(cmap)
fb.setupGlyf(outlines)
fb.setupHorizontalMetrics({n: (widths[n], 0) for n in names})
fb.setupHorizontalHeader(ascent=875, descent=-125, lineGap=0)
fb.setupNameTable({'familyName': 'Neon Pixel', 'styleName': 'Regular'})
fb.setupOS2(version=4, sTypoAscender=875, sTypoDescender=-125, sTypoLineGap=0,
            usWinAscent=1000, usWinDescent=125, fsSelection=0x40 | 0x80)
fb.setupPost()
fb.save(dst + '.ttf')
for flavor in ('woff', 'woff2'):
    fb.font.flavor = flavor
    fb.save(f'{dst}.{flavor}')
print('wrote', dst + '.{ttf,woff,woff2}', len(names) - 1, 'glyphs')
