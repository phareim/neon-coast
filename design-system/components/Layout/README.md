# Layout

Small layout helpers: `.nc-page`, `.nc-wrap`, `.nc-stack`, `.nc-cluster`, `.nc-grid`, `.nc-center` and `.nc-spread`.

- `.nc-page` — at least the viewport tall, on `nc-bg`.
- `.nc-wrap` — a centred column `nc-wrap` (960 px) wide with a `nc-space-4` gutter.
- `.nc-stack` — children in a column, `--nc-gap` apart (default `nc-space-4`); their own margins are dropped.
- `.nc-cluster` — children in a wrapping row, `--nc-gap` apart (default `nc-space-3`).
- `.nc-grid` — cards that fill the row, each at least `--nc-min` (240 px) wide, `--nc-gap` apart (default `nc-space-5`).
- `.nc-center` — centres its content both ways. `.nc-spread` — a row with its ends pushed apart.

The consumer provides the children; set `--nc-gap` or `--nc-min` inline to change the rhythm. Remember the edge sits outside each box: a grid's gap already leaves room for it.
