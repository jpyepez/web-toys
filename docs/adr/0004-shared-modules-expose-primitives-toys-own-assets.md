# Shared Shell modules expose primitives; per-Toy assets live with the Toy

The Shell's `tokens.ts` and `sound.ts` were built when Counting Sheep was the only Toy,
so they absorbed Toy-specific content: `palette` is named for the *meadow* scene
(`skyUpper`, `hillNear`, `sheepWool`) and `sound.ts` carries a sheep-specific `baa()`
method. Adding the Puffer Fish — a totally non-meadow, underwater Toy — forced the
question of whether shared modules keep accreting per-Toy keys/methods or not. We decided:
**shared Shell modules expose only cross-Toy primitives; each Toy owns its own scene
assets locally.** Concretely, `tokens.ts` keeps `font`, `timing`, `chrome`, `card` (and
shared sound concerns `unlock` / `celebrate` / mute on the Sound engine, plus a generic
`play(voice)` synthesis primitive); each Toy ships its own `palette` and its own sound
recipes in its folder (`toys/puffer-fish/palette.ts`, `toys/puffer-fish/sounds.ts`). We
chose this over (a) one flat shared palette/engine that grows a key or method per Toy and
(b) namespacing scenes inside the shared module — both keep Toys reaching into a shared
grab-bag and erode the project's "each Toy is independent, its own assets and logic" rule.

This is the concrete mechanism behind that independence stance, applied the first time a
second Toy tested it.

## Consequences

- **The generic voice primitive (`Voice` shape) becomes public Sound API.** It was
  internal; exposing `play(voice)` makes the oscillator+envelope shape part of the
  Shell↔Toy contract. Toys still never import Web Audio directly and still go through the
  injected `Sound`, so [[0003-audio-synthesis-and-mobile-unlock]] holds — tests still
  observe `oscillator.start` at the boundary.
- **`celebrate()` stays shared.** It is the Shell's Completion flourish, not a Toy sound —
  Completion is owned by the Shell ([[0001-finite-success-only-toy-lifecycle]]).
- **The meadow palette and `baa()` migrate to the Counting Sheep folder.** Leaving them in
  the shared modules would re-create the very grab-bag this decision removes; the migration
  is part of honoring the pattern, not optional cleanup.
- **Future Toys declare their scene palette and sound recipes locally** — the shared
  modules do not grow when a Toy is added (matching how the Toy registry is already
  additive-only).
