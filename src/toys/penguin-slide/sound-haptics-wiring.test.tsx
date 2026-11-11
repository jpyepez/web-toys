import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { MIN_STROKE_PX, PENGUIN_COUNT, PenguinSlide } from './PenguinSlide';
import { peep, swish } from './sounds';
import { fakeSound } from '../../test/fakes';

/** Penguin Slide — sound + haptics wiring through the injected `sound` / `haptics`. */

const penguins = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-penguin]')];
const settle = () => act(() => void vi.advanceTimersByTime(10_000));
const FAR = MIN_STROKE_PX * 5;

function swipe(el: HTMLElement) {
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100, timeStamp: 0 });
  fireEvent.pointerMove(el, { clientX: 100 + FAR, clientY: 100, timeStamp: 50 });
  fireEvent.pointerUp(el, { clientX: 100 + FAR, clientY: 100, timeStamp: 50 });
}
function tap(el: HTMLElement) {
  fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
  fireEvent.pointerUp(el, { clientX: 100, clientY: 100 });
}

const voices = (s: ReturnType<typeof fakeSound>) => s.play.mock.calls.map(([v]) => v);
const plops = (s: ReturnType<typeof fakeSound>) => voices(s).filter((v) => v !== swish && v !== peep);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('PenguinSlide — sound + haptics wiring', () => {
  it('a Swipe plays the swish on launch and the plop on landing', () => {
    const sound = fakeSound();
    const { container } = render(<PenguinSlide onComplete={vi.fn()} sound={sound} />);
    swipe(penguins(container)[0]);
    expect(voices(sound)).toEqual([swish]);
    settle();
    expect(plops(sound)).toHaveLength(1);
  });

  it('the plop rises strictly with each landed penguin', () => {
    const sound = fakeSound();
    const { container } = render(<PenguinSlide onComplete={vi.fn()} sound={sound} />);
    penguins(container).forEach((p) => {
      swipe(p);
      settle();
    });
    const freqs = plops(sound).map((v) => v.freq);
    expect(freqs).toHaveLength(PENGUIN_COUNT);
    freqs.slice(1).forEach((f, i) => expect(f).toBeGreaterThan(freqs[i]));
  });

  it('a tap plays the peep and no swish', () => {
    const sound = fakeSound();
    const { container } = render(<PenguinSlide onComplete={vi.fn()} sound={sound} />);
    tap(penguins(container)[0]);
    expect(voices(sound)).toEqual([peep]);
    expect(peep.peak).toBeLessThan(swish.peak);
  });

  it('a launch triggers a haptic pulse; a tap does not', () => {
    const haptics = { tick: vi.fn() };
    const { container } = render(<PenguinSlide onComplete={vi.fn()} haptics={haptics} />);
    tap(penguins(container)[0]);
    expect(haptics.tick).not.toHaveBeenCalled();
    swipe(penguins(container)[1]);
    expect(haptics.tick).toHaveBeenCalledTimes(1);
  });

  it('runs to onComplete with no sound or haptics passed', () => {
    const onComplete = vi.fn();
    const { container } = render(<PenguinSlide onComplete={onComplete} />);
    penguins(container).forEach((p) => {
      tap(p);
      swipe(p);
      settle();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
