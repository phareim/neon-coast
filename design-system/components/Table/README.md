# Table

The high-score table: all pixel letters, rows 32 px tall between two `nc-rule` lines, headers in `nc-text-subtle`.

Markup: `<table class="nc-table">` with `thead` and `tbody`; a `caption` names it. Mark rows with `.is-hot` (you: an `nc-hot` box around the row) or `.is-prize` (the podium in `nc-prize`), and number cells with `.nc-num` (right-aligned, `nc-accent`). Inside `class="nc"` a bare `<table>` gets the rules and pixel headers but keeps its cells in the body face, for ordinary data.

Do: keep it to ten rows and show your own row even when it is further down.
