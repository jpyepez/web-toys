# Synthesized audio: raw Web Audio, unlocked on first gesture, provided by the Shell

Sound is synthesized at runtime with the **raw Web Audio API**, not Tone.js. We need only a
handful of one-shot sounds (a sheep "baa", a Completion flourish), so a sequencer/Transport
framework like Tone.js (~90KB+ gzip) buys features we don't use and works against the
tiny-bundle value behind [[0002-no-binary-assets-everything-code-generated]]; each sound is
~10–15 lines of oscillator + gain-envelope. Browsers keep audio **suspended until a user
gesture**, so the Shell owns a single shared sound/haptics instance — injected through
`createAppRouter` (mirroring the `history` seam) — and `unlock()`s the audio context on the
**Card tap**, the first gesture, so the resumed context survives navigation and the mounted Toy
plays on it. Toys receive `sound`/`haptics` through the contract; they never import audio directly.

We'd revisit Tone.js only if a Toy needs real music (melody, tempo, loops) — a conscious
reversal, not a quiet add.

## Consequences

- **The engine must be inert where Web Audio is absent.** jsdom (the test environment) has no
  `AudioContext`, so `createSound()` no-ops and never throws when none exists — otherwise every
  Shell test that mounts the default engine would crash.
- **Tests shim the Web Audio boundary; never mock our own code.** Test the engine by injecting a
  fake `AudioContext` via its `contextFactory`; test wiring by injecting fake `Sound`/`Haptics`
  into `createAppRouter`. Assertions observe boundary activity (an oscillator started, `unlock`
  called on the Card tap) — the only observable proxy for "a sound played".
- **Sound quality, the iOS hardware silent switch, and real haptics are validated by hand**, never
  unit-asserted — there is no way to assert them in jsdom.
- `sound`/`haptics` are **optional** on the Toy contract, so a bare-mounted Toy (e.g. a unit test)
  degrades to silence — matching the utilities' own no-op-where-unsupported behaviour.
