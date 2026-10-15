# Meter

A bar that fills in whole cells, like the hold-to-quit bar and the health meters in the games.

Markup: `<div class="nc-meter" style="--nc-value: .6" role="meter" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>` (`role="progressbar"` for progress). It fills down to the last whole cell. `--nc-cells` sets the count (12), `--nc-cell` the cell pitch (8 px: 6 lit, 2 gap). Colours: default `nc-accent`, `--pink`, `--gold`, `--lime`, `--red`; `--fluid` stretches it to its container.

Do: label it, and say the number in words or the label when it matters.
