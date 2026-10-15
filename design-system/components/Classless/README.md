# Classless

Put `class="nc"` on `<body>` or any container and plain HTML inside it takes the look, with no classes at all.

**Styles:** headings (h1 `pixel-48` in `nc-hot` with a glow, h2 `pixel-32` in `nc-accent`, h3 `pixel-24`, h4–h6 `pixel-16`), paragraphs in `body`, links (`nc-accent`, a 2 px underline, `nc-hot` on hover), lists with square cyan bullets, `blockquote` with an `nc-hot` bar, `code`, `pre`, `kbd`, `mark`, `hr`, tables, every `button` and `input`, `select`, `textarea`, `fieldset`, `progress`, `details` and `dialog`. On `<body class="nc">` the body's own `header`, `main` and `footer` become a centred `nc-wrap` column.

**Specificity:** every classless rule sits in `:where()`, so a `.nc-*` class or your own class always wins without `!important`. Put `nc` on the part of a page that should take the look, not around a third-party widget.

Do: write semantic HTML and let the system dress it. Don't: wrap long prose in pixel text — paragraphs stay in the body face on purpose.
