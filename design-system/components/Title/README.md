# Title

Pixel text styles: `.nc-title` for the big pink title, `.nc-hud` for interface text, `.nc-hint` for the call to action, plus `.nc-dim`, `.nc-blink` and `.nc-loading`.

- `.nc-title` — `pixel-48` (`pixel-64` from 800 px wide, `pixel-32` under 480 px) in `nc-hot`, the hard drop and a glow. One per screen. Retint with `--nc-title`.
- `.nc-hud` — `pixel-16` in `nc-accent`: scores, labels, the name of a screen.
- `.nc-hint` — `pixel-16` in `nc-hot`: what to do next (`▶ PRESS START`). Pair with `.nc-blink` on title screens only.
- `.nc-dim` — `nc-text-muted`. `.nc-loading` — dots that count up after a word (`SYNCING…`).
- `.nc-pixel` puts the pixel font on anything (line height 1.5); `.nc-prose` switches back to `body`. Sizes: `.nc-size-0` … `.nc-size-5`; colours: `.nc-cyan`, `.nc-pink`, `.nc-gold`, `.nc-lime`, `.nc-violet`, `.nc-orange`, `.nc-red`, `.nc-white`, `.nc-muted`, `.nc-subtle`; shadows: `.nc-drop`, `.nc-glow`.

Do: keep pixel text at 8 px steps and short. Don't: blink more than one thing on a screen, or set paragraphs in pixel type.
