# Input

Text fields: dark `nc-field` wells with an `nc-quiet` edge that turns `nc-accent` on focus and `nc-danger` when invalid.

Markup: a `.nc-field` stacks `<label class="nc-label">`, the control and an optional `<span class="nc-help">`. Controls: `<input class="nc-input">`, `<textarea class="nc-textarea">`, `<select class="nc-select">` (its ▼ is drawn in `nc-accent`). Typed text is `input` (Space Mono) so case and symbols stay readable; `.nc-input--pixel` switches to pixel capitals for name-entry screens. Invalid: the browser's `:user-invalid`, or `aria-invalid="true"` from your own validation — with a `.nc-help` line saying how to fix it.

Do: always pair a control with a visible label. Don't: use the placeholder as the label.
