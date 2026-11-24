import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SoupPot, TAP_DISTANCE_PX } from './SoupPot';
import { fakeSound } from '../../test/fakes';
import { squeak } from './sounds';
import { GOAL_ANGLE } from './stir';

const R = 100;
const pt = (a: number, r = R) => ({ clientX: r * Math.cos(a), clientY: r * Math.sin(a) });

const mount = () => {
  const sound = fakeSound();
  const onComplete = vi.fn();
  const { container } = render(<SoupPot onComplete={onComplete} sound={sound} />);
  const main = screen.getByRole('main');
  const mouse = (i: number) => container.querySelector(`[data-mouse="${i}"] [data-mouse-part="head"]`)!;
  const group = (i: number) => container.querySelector(`[data-mouse="${i}"]`)!;
  const squeaks = () =>
    sound.play.mock.calls.map((c) => c[0]).filter((v) => v.type === 'square');
  const tap = (i: number) => {
    const at = { clientX: 300, clientY: 50 };
    fireEvent.pointerDown(mouse(i), { pointerId: 1, ...at });
    fireEvent.pointerUp(mouse(i), { pointerId: 1, ...at });
  };
  const stirFromMouse = (i: number) => {
    fireEvent.pointerDown(mouse(i), { pointerId: 1, clientX: R, clientY: 0 });
    for (let k = 1; k <= 8; k++) fireEvent.pointerMove(main, { pointerId: 1, ...pt(k * 0.2) });
    fireEvent.pointerUp(main, { pointerId: 1 });
  };
  return { sound, onComplete, main, mouse, group, squeaks, tap, stirFromMouse };
};

describe('Soup Pot mouse tap', () => {
  it('sets the reacting state and plays a squeak', () => {
    const { group, squeaks, tap } = mount();
    expect(group(0)).toHaveAttribute('data-reacting', 'false');
    tap(0);
    expect(group(0)).toHaveAttribute('data-reacting', 'true');
    expect(squeaks()).toEqual([squeak(0)]);
  });

  it('works repeatedly', () => {
    const { group, squeaks, tap } = mount();
    tap(1);
    tap(1);
    tap(1);
    expect(squeaks()).toHaveLength(3);
    expect(group(1)).toHaveAttribute('data-taps', '3');
  });

  it('leaves progress and stage unchanged', () => {
    const { main, tap } = mount();
    tap(2);
    expect(main).toHaveAttribute('data-progress', '0');
    expect(main).toHaveAttribute('data-stage', '0');
  });

  it('squeaks at a different pitch per mouse', () => {
    const { squeaks, tap } = mount();
    [0, 1, 2].forEach(tap);
    const freqs = squeaks().map((v) => v.freq);
    expect(new Set(freqs).size).toBe(3);
  });

  it('plays the hop silently with no sound passed', () => {
    render(<SoupPot onComplete={() => {}} />);
    const g = document.querySelector('[data-mouse="0"]')!;
    const head = g.querySelector('[data-mouse-part="head"]')!;
    fireEvent.pointerDown(head, { pointerId: 1, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(head, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(g).toHaveAttribute('data-reacting', 'true');
  });

  it('treats a press that moves past the tap distance as a Stir, not a tap', () => {
    const { main, group, squeaks, stirFromMouse } = mount();
    stirFromMouse(0);
    expect(Number(main.getAttribute('data-progress'))).toBeGreaterThan(0);
    expect(group(0)).toHaveAttribute('data-reacting', 'false');
    expect(squeaks()).toHaveLength(0);
  });

  it('does not tap when the press wanders past the distance and returns', () => {
    const { mouse, main, group } = mount();
    fireEvent.pointerDown(mouse(0), { pointerId: 1, clientX: 300, clientY: 50 });
    fireEvent.pointerMove(main, { pointerId: 1, clientX: 300 + TAP_DISTANCE_PX + 5, clientY: 50 });
    fireEvent.pointerMove(main, { pointerId: 1, clientX: 300, clientY: 50 });
    fireEvent.pointerUp(main, { pointerId: 1 });
    expect(group(0)).toHaveAttribute('data-reacting', 'false');
  });

  it('is not triggered by a Stir that sweeps over a mouse', () => {
    const { main, mouse, group, squeaks } = mount();
    fireEvent.pointerDown(main, { pointerId: 1, ...pt(0) });
    for (let k = 1; k <= 10; k++) fireEvent.pointerMove(mouse(0), { pointerId: 1, ...pt(k * 0.2) });
    fireEvent.pointerUp(mouse(0), { pointerId: 1, ...pt(2) });
    expect(Number(main.getAttribute('data-progress'))).toBeGreaterThan(0);
    for (const i of [0, 1, 2]) expect(group(i)).toHaveAttribute('data-reacting', 'false');
    expect(squeaks()).toHaveLength(0);
  });

  it('ignores taps once the Goal is reached', () => {
    const { main, mouse, group, squeaks, onComplete } = mount();
    fireEvent.pointerDown(main, { pointerId: 1, ...pt(0) });
    for (let k = 1; k * 0.2 < GOAL_ANGLE + 1; k++) fireEvent.pointerMove(main, { pointerId: 1, ...pt(k * 0.2) });
    fireEvent.pointerUp(main, { pointerId: 1 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    fireEvent.pointerDown(mouse(0), { pointerId: 2, clientX: 300, clientY: 50 });
    fireEvent.pointerUp(mouse(0), { pointerId: 2, clientX: 300, clientY: 50 });
    expect(group(0)).toHaveAttribute('data-reacting', 'false');
    expect(squeaks()).toHaveLength(0);
  });
});
