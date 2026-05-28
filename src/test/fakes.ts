/**
 * Test doubles for the boundaries the codebase permits stubbing — currently
 * just `localStorage`, the Sound utility's persistence boundary for the mute
 * preference. Web Audio has its own per-test shim that lives alongside the
 * sound tests, because it needs the (mutable) `oscillators` handle.
 */

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
