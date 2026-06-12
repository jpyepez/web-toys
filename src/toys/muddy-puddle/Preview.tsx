/**
 * Muddy Puddle's tiny SVG preview-scene — the miniature barnyard vignette a
 * Home Card carries above its title. Drawn from inside the Toy so its
 * composition stays coherent with the live scene (`BarnyardBackdrop`) and cast
 * (`WipeableCritter`) — visual coherence between the preview and the live Toy
 * is on-device per this slice's Notes, which is exactly why the preview lives
 * next to the Toy that owns its palette and silhouettes.
 *
 * Decorative for accessibility — the Card's title and `<Link>` carry the
 * semantic load; the SVG is `aria-hidden` so screen readers skim past it.
 */
export function Preview() {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  );
}
