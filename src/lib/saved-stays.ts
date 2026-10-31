import { useSyncExternalStore } from "react";

/**
 * Session-only saved stays. The set lives at module scope so hearts survive
 * tab switches and new Home queries; it resets when the app restarts.
 */
let savedIds: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return savedIds;
}

export function toggleSaved(id: string) {
  const next = new Set(savedIds);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  savedIds = next;
  listeners.forEach((listener) => listener());
}

export function useSavedStays() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
