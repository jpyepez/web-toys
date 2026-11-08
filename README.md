# web-toys

A phone-first, installable PWA of tiny, finite Toys for young children (around 3–4).
The child taps a code-drawn Critter, something fun happens, and the Toy ends with a
Completion celebration in about 30 seconds. There is no timer, no losing and no score.

## Toys

- **Counting Sheep** — tap each sheep in turn until all five are counted.
- **Puffer Fish** — tap the fish and watch them puff up and float away.
- **Muddy Puddle** — wipe the mud off each muddy critter until it is clean.
- **Up & Away** — hold to inflate the balloons, then float the bunch up into the sky.
- **Tuck-In** — carry each fledgling home to the nest until every bird is asleep.

## Develop

Uses [Bun](https://bun.sh).

```sh
bun install        # install dependencies
bun run dev        # start the Vite dev server
bun run test       # run the Vitest suite once
bun run build      # typecheck and build for production
```

## No image or audio files

The Toys ship no image or audio files. Critters are code-drawn SVG and sound is
synthesised.

## Licence

MIT. See [LICENSE](LICENSE).
