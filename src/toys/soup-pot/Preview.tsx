import { buildKitchen, type Frame } from './kitchen';
import { KITCHEN, KITCHEN_SEED } from './kitchen-config';
import { KitchenPlates, LadleLayer, SoupLayer } from './KitchenScene';
import { MouseFigure, PAW_FRACTION, VB } from './MouseDrawing';

/**
 * Soup Pot's Card preview — the real scene, drawn by the real components.
 *
 * The kitchen comes from `buildKitchen` with the shipped config and seed,
 * evaluated into the Card's 100x60 frame, and the mice are `MouseFigure`, the
 * very component the Toy mounts. So the Card cannot drift from the Toy, and a
 * lab harvest updates both.
 *
 * It shows the Toy MID-STIR — the soup half cooked and bubbling, the ladle
 * round to one side — because a Card that shows what happens is a better
 * invitation than one that shows only who is there. A still frame: nothing loops.
 *
 * Decorative for accessibility — the Card's title and link carry the meaning.
 */

const CARD: Frame = { w: 100, h: 60 };
/** A mouse's width in Card units — a landscape window's worth of mouse. */
const CARD_MOUSE = 12;
const ART = buildKitchen(KITCHEN, CARD, CARD_MOUSE, KITCHEN_SEED);

export function Preview() {
  return (
    <svg
      viewBox={`0 0 ${CARD.w} ${CARD.h}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <KitchenPlates art={ART} />
      <SoupLayer art={ART} fraction={0.55} stage={2} swirl={0.9} still />
      <LadleLayer art={ART} angle={-0.7} />
      {ART.mice.map((m) => (
        <g key={m.kind} transform={`translate(${m.at[0] - CARD_MOUSE / 2} ${m.at[1] - CARD_MOUSE * PAW_FRACTION}) scale(${CARD_MOUSE / VB})`}>
          <MouseFigure kind={m.kind} />
        </g>
      ))}
    </svg>
  );
}
