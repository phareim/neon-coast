# Alert

A status line in a box, with a glyph in front: ◈ for news, ✓ for success, ! for a warning, × for an error.

Markup: `<div class="nc-alert nc-alert--ok"><p>Name changed to NEON OTTER.</p></div>`. Variants: none (`nc-accent`), `--ok` (`nc-ok`), `--warn` (`nc-warn`), `--danger` (`nc-danger`). The glyph comes from the variant, so the state never rests on colour alone. Text is `body`; keep it to one sentence that says what happened and what to do.

Do: put `role="status"` (or `role="alert"` for errors) on it when it appears after an action.
