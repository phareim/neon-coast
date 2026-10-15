# Choice

Checkboxes, radio buttons and switches: dark squares that fill with `nc-accent`.

Markup: `<label class="nc-choice nc-label"><input class="nc-check" type="checkbox"> Show hints</label>`; `.nc-radio` for `type="radio"`; `.nc-switch` for `<input type="checkbox" role="switch">` (its knob jumps, never slides). Checked boxes show a pixel ✓, mixed ones (`indeterminate`) a bar. Focus is a 2 px `nc-hot` outline two units out.

Do: use a switch for something that takes effect at once (sound), a checkbox for a choice that is submitted.
