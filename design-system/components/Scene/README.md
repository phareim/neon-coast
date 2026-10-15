# Scene

`<nc-scene>` is the coast at dusk, live: twinkling stars, a swell with the sun's broken reflection, palms in the wind, lit by a light map with bloom, scanlines and a vignette.

Markup: `<nc-scene></nc-scene>` needs `components/bundle.js`. Attributes: `scene` (`coast`, `town`, `hills`, `dusk`), `pixels` (logical pixels top to bottom, 180: fewer is chunkier), `horizon` (0–1, 0.6), `sun` (0–1 or `none`), `still` (one frame), `bare` (no light map or overlay), `fixed` (fills the viewport behind the page). Without a height it is half as tall as it is wide (`--nc-scene-ratio`); a height or insets win.

It renders at about twelve frames a second, stops off screen and in background tabs, and draws one still frame under reduced motion. Use one per page, as a hero or a backdrop, and put text over it in a Box or with the drop.
