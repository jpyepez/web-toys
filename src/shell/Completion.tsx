import { useEffect, useState } from 'react';

/** Length of the celebration burst before the end state is offered (ms). */
const CELEBRATION_MS = 600;

type CompletionProps = {
  /** Replay the Toy from its start. */
  onPlayAgain: () => void;
  /** Leave the Toy and return to the launcher. */
  onHome: () => void;
};

/**
 * The Shell's Completion: the celebratory end moment after a Toy's Goal is met.
 * Owned entirely by the Shell (ADR-0001) — individual toys never render it.
 *
 * A confetti-style burst plays first; after a short beat the end state appears,
 * offering Play again / Home. The end state then stays put — no auto-advance.
 */
export function Completion({ onPlayAgain, onHome }: CompletionProps) {
  const [showEndState, setShowEndState] = useState(false);

  useEffect(() => {
    const beat = setTimeout(() => setShowEndState(true), CELEBRATION_MS);
    return () => clearTimeout(beat);
  }, []);

  return (
    <div>
      <h2>You did it!</h2>
      {showEndState && (
        <div>
          <button type="button" onClick={onPlayAgain}>
            Play again
          </button>
          <button type="button" onClick={onHome}>
            Home
          </button>
        </div>
      )}
    </div>
  );
}
