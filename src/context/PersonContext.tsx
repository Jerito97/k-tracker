"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "k-tracker:persona";

interface PersonContextValue {
  persona: string | null;
  personas: string[];
  loadingPersonas: boolean;
  error: string | null;
  setPersona: (nombre: string) => void;
  clearPersona: () => void;
  addPersona: (nombre: string) => Promise<void>;
  refreshPersonas: () => Promise<void>;
}

const PersonContext = createContext<PersonContextValue | null>(null);

export function PersonProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<string | null>(null);
  const [personas, setPersonas] = useState<string[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setPersonaState(saved);
    setHydrated(true);
  }, []);

  const refreshPersonas = useCallback(async () => {
    setLoadingPersonas(true);
    setError(null);
    try {
      const res = await fetch("/api/people");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar personas");
      setPersonas(data.personas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingPersonas(false);
    }
  }, []);

  useEffect(() => {
    refreshPersonas();
  }, [refreshPersonas]);

  const setPersona = useCallback((nombre: string) => {
    window.localStorage.setItem(STORAGE_KEY, nombre);
    setPersonaState(nombre);
  }, []);

  const clearPersona = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setPersonaState(null);
  }, []);

  const addPersona = useCallback(
    async (nombre: string) => {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar la persona.");
      await refreshPersonas();
      setPersona(nombre);
    },
    [refreshPersonas, setPersona]
  );

  const value = useMemo(
    () => ({
      persona: hydrated ? persona : null,
      personas,
      loadingPersonas,
      error,
      setPersona,
      clearPersona,
      addPersona,
      refreshPersonas,
    }),
    [hydrated, persona, personas, loadingPersonas, error, setPersona, clearPersona, addPersona, refreshPersonas]
  );

  return <PersonContext.Provider value={value}>{children}</PersonContext.Provider>;
}

export function usePersonContext(): PersonContextValue {
  const ctx = useContext(PersonContext);
  if (!ctx) throw new Error("usePersonContext debe usarse dentro de <PersonProvider>");
  return ctx;
}
