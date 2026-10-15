# Menu

A list of choices with the ▶ cursor, the way a pause menu works.

Markup: `<ul class="nc-menu"><li><button aria-current="true">Continue</button></li>…</ul>` — items are `button`s or `a`s. The ▶ marks the item under the pointer, the focused one and the current one (`aria-current`, `aria-selected` or `.is-active`); a disabled item is `nc-slate` and gets no cursor. Put it in a Box.

Do: keep items to one or two words. Don't: mix links and buttons that do the same kind of thing.
