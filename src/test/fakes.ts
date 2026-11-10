import { vi } from 'vitest';
import type { Sound } from '../shell/sound';

/**
 * Test doubles for the boundaries the codebase permits stubbing: `localStorage`,
 * the Sound utility's persistence boundary for the mute preference, and the
 * `Sound` itself (what the Shell hands a Toy). Web Audio has its own per-test
 * shim that lives alongside the sound tests, because it needs the (mutable)
 * `oscillators` handle.
 */

/** A fake `Sound` of `vi.fn()` spies. Starts unmuted; `setMuted(next)` changes
 *  what `isMuted()` returns. Inferred (not annotated `: Sound`) so callers keep
 *  the spies' mock typing, e.g. `sound.play.mock.calls`. */
export function fakeSound() {
  let muted = false;
  return {
    unlock: vi.fn(),
    play: vi.fn(),
    celebrate: vi.fn(),
    isMuted: vi.fn(() => muted),
    setMuted: vi.fn((next: boolean) => {
      muted = next;
    }),
  } satisfies Sound;
}

/** A minimal Storage shim backed by an in-memory Map. Pass an initial state to
 *  simulate "the app restarted with this stored preference". */
export function fakeStorage(backing: Map<string, string> = new Map()): Storage {
  return {
    get length() {
      return backing.size;
    },
    key: (i: number) => Array.from(backing.keys())[i] ?? null,
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      backing.set(k, v);
    },
    removeItem: (k: string) => {
      backing.delete(k);
    },
    clear: () => {
      backing.clear();
    },
  };
}
