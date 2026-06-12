# Wipe coverage is discrete SVG smudge blobs, not a canvas mask

The Muddy Puddle Toy needs to track how "clean" a Critter is as the child **Wipes** mud
off it. We model the mud as a set of discrete SVG smudge blobs layered over the clean
Critter — a blob clears when the finger crosses it, and "clean enough" is a fraction of
blobs removed — rather than a `<canvas>` mud layer erased with `destination-out` and
measured by transparent-pixel ratio. We chose blobs for **testability and SVG purity**:
coverage is observable by counting remaining blob nodes (no pixel-reading), the Toy stays
all-SVG per [[0002-no-binary-assets-everything-code-generated]], and it matches the
project's "observe the boundary, don't read rendered output" testing posture
([[0003-audio-synthesis-and-mobile-unlock]]). The accepted cost is a chunkier reveal (mud
vanishes blob-by-blob, not as a smooth smear) — judged age-appropriate, since blob-by-blob
gives a 3-year-old clearer cause-and-effect ("I wiped there, that bit cleared").

## Consequences

- Per-Critter wipe progress is **unit-testable** (assert remaining-blob count crosses the
  threshold), unlike the on-device-only backdrop geometry of
  [[0005-toy-backdrops-bottom-anchored-layered-scenes]]. The exact blob count and the
  clean-enough threshold remain on-device-tuned, but *that* the threshold is reached is an
  assertable contract.
- No `<canvas>` enters the codebase; Critters and their mud stay SVG primitives.
- A future Toy wanting a genuinely smooth smear/erase reveal would need to revisit this —
  it is a deliberate ceiling on visual fidelity traded for testability.
