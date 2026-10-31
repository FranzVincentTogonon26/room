import { useFocusEffect } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fetchStays, StaysFetchError } from "@/data/live-stays";
import type { Stay } from "@/data/stays";

const FETCH_TIMEOUT_MS = 12_000;
const FALLBACK_ERROR = "We couldn't load stays. Check your connection and try again.";

type StaysStatus = "loading" | "ready" | "error";

type StaysContextValue = {
  stays: Stay[];
  status: StaysStatus;
  error?: string;
  refreshing: boolean;
  refreshError?: string;
  refresh: () => void;
  retry: () => void;
};

const StaysContext = createContext<StaysContextValue | null>(null);

function messageFor(error: unknown) {
  return error instanceof StaysFetchError ? error.message : FALLBACK_ERROR;
}

/**
 * One shared source of published Sanity stays for Home and Search. Loads once
 * on mount, refreshes when a screen regains focus, and never mixes in the
 * local sample stays.
 */
export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [status, setStatus] = useState<StaysStatus>("loading");
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string>();

  const mounted = useRef(true);
  const inFlight = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const hasData = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, []);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    // One request at a time: a focus refresh never stacks on the first load.
    if (inFlight.current) return;

    const controller = new AbortController();
    inFlight.current = controller;
    const id = requestId.current + 1;
    requestId.current = id;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    if (mode === "refresh") {
      setRefreshing(true);
      setRefreshError(undefined);
    } else {
      setStatus("loading");
      setError(undefined);
    }

    try {
      const next = await fetchStays(controller.signal);
      if (!mounted.current || id !== requestId.current) return;

      hasData.current = true;
      setStays(next);
      setStatus("ready");
      setError(undefined);
      setRefreshError(undefined);
    } catch (caught) {
      if (!mounted.current || id !== requestId.current) return;
      // An unmount or a superseded request is not a failure to show.
      if (controller.signal.aborted && !timedOut) return;

      const message = messageFor(caught);
      if (mode === "refresh" && hasData.current) {
        setRefreshError(message);
      } else {
        setStatus("error");
        setError(message);
      }
    } finally {
      clearTimeout(timeout);
      if (inFlight.current === controller) inFlight.current = null;
      if (mounted.current && id === requestId.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Deferred a tick so the first fetch never sets state during the effect.
    const id = setTimeout(() => void load("initial"), 0);
    return () => clearTimeout(id);
  }, [load]);

  const refresh = useCallback(() => {
    void load("refresh");
  }, [load]);

  const retry = useCallback(() => {
    void load(status === "error" ? "initial" : "refresh");
  }, [load, status]);

  const value = useMemo(
    () => ({
      stays,
      status,
      error,
      refreshing,
      refreshError,
      refresh,
      retry,
    }),
    [stays, status, error, refreshing, refreshError, refresh, retry],
  );

  return <StaysContext.Provider value={value}>{children}</StaysContext.Provider>;
}

export function useStays() {
  const value = useContext(StaysContext);
  if (!value) throw new Error("useStays must be used inside StaysProvider");
  return value;
}

/** Reloads published stays whenever the screen regains focus. */
export function useRefreshStaysOnFocus() {
  const { refresh } = useStays();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
}
