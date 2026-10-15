# Button

A small box that lights up: on hover and keyboard focus its edge colour fills it and the letters turn `nc-ink`.

Markup: `<button class="nc-btn">Continue</button>`, or an `<a class="nc-btn">`. Inside `class="nc"` a bare `<button>` is already one. Labels are `pixel-16`, verb first, a glyph in front when it helps (`▶ START`, `♪ ON`, `× QUIT`).

- Colours: default `nc-accent`; `--pink` for the one action the screen is for, `--gold`, `--lime`, `--violet`, `--red` (destructive).
- Kinds: `--solid` (lit at rest — the primary action), `--ghost` (no box until hovered — navigation).
- Sizes: `--sm` (24 px), default (32 px), `--lg` (48 px, `pixel-24` — touch screens), `--icon` (square; give it `aria-label`), `--block` (full width).
- States: `aria-pressed="true"`, `aria-selected="true"`, `aria-current` or `.is-active` keep it lit; `disabled` turns it `nc-slate`. Rows of buttons: `.nc-btns`.

Do: one pink or solid button per screen. Don't: animate it, round it, or put two words where one will do.
