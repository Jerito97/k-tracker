import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CREW } from "../data";
import { useLocalStorage } from "../lib/storage";
import type { KindFilter, PersonId, Screen, Status, StatsVariant, StatusFilter } from "../types";
import { mergeTitles, type Overrides } from "./selectors";

const STATE_KEY = "k-tracker:state:v1";

interface Persisted {
  me: PersonId | null;
  overrides: Overrides;
  addedDiscover: string[];
  statsVariant: StatsVariant;
  omdbApiKey: string;
}

const DEFAULT_PERSISTED: Persisted = {
  me: null,
  overrides: {},
  addedDiscover: [],
  statsVariant: "v1",
  omdbApiKey: "",
};

interface AppState {
  // persisted
  me: PersonId;
  addedDiscover: string[];
  statsVariant: StatsVariant;
  omdbApiKey: string;
  titles: ReturnType<typeof mergeTitles>;

  // ephemeral nav
  screen: Screen;
  detailId: string | null;
  statusFilter: StatusFilter;
  kindFilter: KindFilter;
  toast: string;
  toastNonce: number;

  // actions
  pickProfile: (id: PersonId) => void;
  goGate: () => void;
  openDetail: (id: string) => void;
  backToTracker: () => void;
  goDiscover: () => void;
  goStats: () => void;
  goTracker: () => void;
  setStatusFilter: (f: StatusFilter) => void;
  setKindFilter: (f: KindFilter) => void;
  setTitleStatus: (titleId: string, status: Status) => void;
  setScore: (titleId: string, personId: PersonId, score: number) => void;
  bumpEpisode: (titleId: string) => void;
  addDiscoverItem: (id: string, title: string) => void;
  setStatsVariant: (v: StatsVariant) => void;
  setOmdbApiKey: (key: string) => void;
}

const AppStateCtx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<Persisted>(STATE_KEY, DEFAULT_PERSISTED);

  const [screen, setScreen] = useState<Screen>("gate");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [kindFilter, setKindFilter] = useState<KindFilter>("todo");
  const [toast, setToast] = useState("");
  const [toastNonce, setToastNonce] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setToastNonce((n) => n + 1);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const patchOverride = useCallback(
    (titleId: string, patch: Partial<Overrides[string]>) => {
      setPersisted((s) => ({
        ...s,
        overrides: {
          ...s.overrides,
          [titleId]: { ...s.overrides[titleId], ...patch },
        },
      }));
    },
    [setPersisted],
  );

  const titles = useMemo(() => mergeTitles(persisted.overrides), [persisted.overrides]);
  const me = persisted.me ?? CREW[0].id;

  const value: AppState = {
    me,
    addedDiscover: persisted.addedDiscover,
    statsVariant: persisted.statsVariant,
    omdbApiKey: persisted.omdbApiKey,
    titles,

    screen,
    detailId,
    statusFilter,
    kindFilter,
    toast,
    toastNonce,

    pickProfile: (id) => {
      setPersisted((s) => ({ ...s, me: id }));
      setScreen("tracker");
    },
    goGate: () => setScreen("gate"),
    openDetail: (id) => {
      setDetailId(id);
      setScreen("detail");
    },
    backToTracker: () => {
      setDetailId(null);
      setScreen("tracker");
    },
    goDiscover: () => setScreen("discover"),
    goStats: () => setScreen("stats"),
    goTracker: () => setScreen("tracker"),
    setStatusFilter,
    setKindFilter,
    setTitleStatus: (titleId, status) => {
      patchOverride(titleId, { status });
      flash(`${status[0].toUpperCase()}${status.slice(1)} · guardado`);
    },
    setScore: (titleId, personId, score) => {
      const current = titles.find((t) => t.id === titleId);
      patchOverride(titleId, { ratings: { ...current?.ratings, [personId]: score } });
    },
    bumpEpisode: (titleId) => {
      const current = titles.find((t) => t.id === titleId);
      if (!current) return;
      patchOverride(titleId, { ep: Math.min(current.epTotal, current.ep + 1) });
    },
    addDiscoverItem: (id, title) => {
      if (persisted.addedDiscover.includes(id)) return;
      setPersisted((s) => ({ ...s, addedDiscover: [...s.addedDiscover, id] }));
      flash(`"${title}" a Pendientes`);
    },
    setStatsVariant: (v) => setPersisted((s) => ({ ...s, statsVariant: v })),
    setOmdbApiKey: (key) => setPersisted((s) => ({ ...s, omdbApiKey: key })),
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function countLine(total: number, visible: number): string {
  return `${visible} de ${total} títulos · toca una card para las notas`;
}

export function statsFootnote(total: number): string {
  return `Sobre ${total} títulos cargados entre abril y septiembre. Liz va ganando y no deja de mencionarlo.`;
}

export const LAST_ACTIVITY = "Liz terminó Reply 1988 hace 5 días";
