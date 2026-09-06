"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import { TituloCard } from "@/components/TituloCard";
import type { Titulo } from "@/lib/types";
import { ESTADOS } from "@/lib/types";

const FILTRO_TODOS = "Todos";

export default function TrackerPage() {
  const { persona, personas } = usePersonContext();
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>(FILTRO_TODOS);
  const [filtroPersona, setFiltroPersona] = useState<string>("__yo__");

  async function cargarTitulos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/titles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar los títulos");
      setTitulos(data.titulos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTitulos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate(row: number, campo: "estado" | "nota", valor: string | number) {
    if (!persona) return;
    setTitulos((prev) =>
      prev.map((t) =>
        t.row === row
          ? {
              ...t,
              personas: {
                ...t.personas,
                [persona]: {
                  ...t.personas[persona],
                  [campo === "estado" ? "estado" : "nota"]: valor,
                },
              },
            }
          : t
      )
    );
    const res = await fetch(`/api/titles/${row}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, campo, valor }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "No se pudo guardar el cambio.");
    }
  }

  const personaParaFiltro = filtroPersona === "__yo__" ? persona : filtroPersona;

  const titulosFiltrados = useMemo(() => {
    return titulos.filter((t) => {
      if (filtroEstado === FILTRO_TODOS) return true;
      const estadoPersona = personaParaFiltro ? t.personas[personaParaFiltro]?.estado : null;
      return (estadoPersona || "Pendiente") === filtroEstado;
    });
  }, [titulos, filtroEstado, personaParaFiltro]);

  if (!persona) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tracker</h1>
        <span className="muted">{titulosFiltrados.length} títulos</span>
      </div>

      <div className="filter-row">
        <span className="filter-label">Estado</span>
        <div className="filter-bar">
          {[FILTRO_TODOS, ...ESTADOS].map((e) => (
            <button
              key={e}
              className={"filter-chip" + (filtroEstado === e ? " active" : "")}
              onClick={() => setFiltroEstado(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Estado de</span>
        <div className="filter-bar">
          <button
            className={"filter-chip" + (filtroPersona === "__yo__" ? " active" : "")}
            onClick={() => setFiltroPersona("__yo__")}
          >
            Yo ({persona})
          </button>
          {personas
            .filter((p) => p !== persona)
            .map((p) => (
              <button
                key={p}
                className={"filter-chip" + (filtroPersona === p ? " active" : "")}
                onClick={() => setFiltroPersona(p)}
              >
                {p}
              </button>
            ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading && (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      )}

      {!loading && titulosFiltrados.length === 0 && !error && (
        <div className="empty-state">No hay títulos que matcheen este filtro todavía.</div>
      )}

      {!loading &&
        titulosFiltrados.map((t) => (
          <TituloCard key={t.row} titulo={t} personaActual={persona} onUpdate={handleUpdate} />
        ))}
    </div>
  );
}
