# Box

The dialog box: a dark `nc-surface` panel with the one-unit edge in `nc-accent`, open corners, and a faint `nc-box-rule` line inside the top edge.

Markup: `<div class="nc-box">…</div>`; padding is `nc-space-4` (`--nc-box-pad` changes it); its first and last child lose their outer margins.

Variants: `--pink` (you, or something that wants an answer), `--gold` (treasure), `--lime`, `--violet`, `--quiet` (`nc-quiet`: things that should not shout), `--flat` (no inner rule), `--solid` (opaque `nc-ink` instead of the 88 % surface). Retint any box with `style="--nc-edge: …"`.

Do: use one box per thing on screen; let a scene glow through the surface. Don't: round it, add a drop shadow, or nest boxes more than once.
