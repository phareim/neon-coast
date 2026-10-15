# Sprite

`<nc-sprite>` draws pixel art written as text: one palette letter per pixel, `.` for see-through.

Markup: rows as the element's text, or `name` for a ready-made one (`heart`, `heart-half`, `heart-empty`, `gem`, `key`, `bomb`, `coin`, `star`, `home`, `cursor`, `sun`). Attributes: `scale` (CSS px per pixel, 4), `colors` (palette overrides, `"p:#2ff3ff"`), `shade` (`"body hi lo"`: outline and shade a shape drawn with `X`), `flip`, `label` (its accessible name; without one it is decorative). Needs `components/bundle.js`. Letters: `k` ink, `c` cyan, `p` pink, `y` gold, `w` white, `v` violet, `l` lime, `r` red, `o` orange… (see the colour tokens).

Do: give sprites an ink outline and a lighter top edge (`shade` does both); scale by whole numbers only.
