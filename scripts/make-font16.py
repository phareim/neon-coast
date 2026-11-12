#!/usr/bin/env python3
"""Draw the glyph JSON from make-font16.mjs as a TrueType font: <out>.ttf,
<out>.woff and <out>.woff2.

One font pixel = 100 units and the em is 14 pixels, the 16-bit line: one
pixel over the twelve-pixel capitals and one under the baseline. So at
font-size 14n px every font pixel is exactly n CSS px. Marks over a capital
(Å's ring, É's accent) reach three pixels higher and a comma's tail two
lower; the win metrics cover them so they are not clipped, while the typo
metrics keep the line at 14 pixels. Lower case maps to the capitals. The
advance is the glyph's width plus two pixels, as on the canvas."""
import json
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

src, dst = sys.argv[1], sys.argv[2]
glyphs = json.load(open(src, encoding='utf-8'))
U = 100
CAP = 12


def draw(rows, lift):
    pen = TTGlyphPen(None)
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
            top = (CAP - gy) * U
            bot = top - U
            pen.moveTo((s * U, bot))
            pen.lineTo((s * U, top))
            pen.lineTo((x * U, top))
            pen.lineTo((x * U, bot))
            pen.closePath()
    return pen.glyph()


names, cmap, widths, outlines = ['.notdef'], {}, {'.notdef': 10 * U}, {}
# .notdef: a hollow box, so a missing character is visible.
box = ['########'] + ['##....##'] * 10 + ['########']
outlines['.notdef'] = draw(box, 0)
for i, (ch, g) in enumerate(glyphs.items()):
    name = f'g{i}'
    names.append(name)
    outlines[name] = draw(g['rows'], g['above'])
    widths[name] = (len(g['rows'][0]) + 2) * U
    cmap[ord(ch)] = name
    low = ch.lower()
    if ch.isalpha() and low != ch and len(low) == 1 and ord(low) not in cmap:
        cmap[ord(low)] = name

fb = FontBuilder(1400, isTTF=True)
fb.setupGlyphOrder(names)
fb.setupCharacterMap(cmap)
fb.setupGlyf(outlines)
fb.setupHorizontalMetrics({n: (widths[n], 0) for n in names})
fb.setupHorizontalHeader(ascent=1300, descent=-100, lineGap=0)
fb.setupNameTable({'familyName': 'Neon Pixel 16', 'styleName': 'Regular'})
fb.setupOS2(version=4, sTypoAscender=1300, sTypoDescender=-100, sTypoLineGap=0,
            usWinAscent=1500, usWinDescent=200, sCapHeight=1200, sxHeight=1200,
            fsSelection=0x40 | 0x80)
fb.setupPost()
fb.save(dst + '.ttf')
for flavor in ('woff', 'woff2'):
    fb.font.flavor = flavor
    fb.save(f'{dst}.{flavor}')
print('wrote', dst + '.{ttf,woff,woff2}', len(names) - 1, 'glyphs')
