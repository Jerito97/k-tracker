"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import { TituloCard } from "@/components/TituloCard";
import { TituloDetail } from "@/components/TituloDetail";
import { colorFor, initialFor } from "@/lib/palette";
import type { Titulo } from "@/lib/types";
import { ESTADOS } from "@/lib/types";

const FILTRO_TODOS = "Todos";
const KIND_FILTROS: [string, string][] = [
  ["Todo", "Series y películas"],
  ["Serie", "Series"],
  ["Película", "Películas"],
];

const STATUS_DOT: Record<string, string> = {
  Todos: "rgba(236,234,240,.25)",
  Pendiente: "rgba(236,234,240,.4)",
  Mirando: "var(--accent)",
  Visto: "var(--accent-2)",
};

export default function TrackerPage() {
  const { persona, personas, clearPersona } = usePersonContext();
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>(FILTRO_TODOS);
  const [filtroTipo, setFiltroTipo] = useState<string>("Todo");
  const [openRow, setOpenRow] = useState<number | null>(null);

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
  }, []);

  async function handleUpdate(row: number, campo: "estado" | "nota", valor: string | number) {
    if (!persona) return;
    setTitulos((prev) =>
      prev.map((t) =>
        t.row === row
          ? { ...t, personas: { ...t.personas, [persona]: { ...t.personas[persona], [campo]: valor } } }
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

  const byStatus = (k: string) =>
    persona ? titulos.filter((t) => (t.personas[persona]?.estado || "Pendiente") === k).length : 0;

  const statusFilters = [FILTRO_TODOS, ...ESTADOS].map((k) => ({
    key: k,
    label: k,
    count: k === FILTRO_TODOS ? titulos.length : byStatus(k),
    dot: STATUS_DOT[k],
  }));

  const titulosFiltrados = useMemo(() => {
    if (!persona) return [];
    return titulos.filter((t) => {
      const estadoPersona = t.personas[persona]?.estado || "Pendiente";
      const matchEstado = filtroEstado === FILTRO_TODOS || estadoPersona === filtroEstado;
      const matchTipo = filtroTipo === "Todo" || t.tipo === filtroTipo;
      return matchEstado && matchTipo;
    });
  }, [titulos, filtroEstado, filtroTipo, persona]);

  const tituloAbierto = openRow != null ? titulos.find((t) => t.row === openRow) : null;

  if (!persona) return null;

  const myColor = colorFor(personas.indexOf(persona));

  if (tituloAbierto) {
    return (
      <TituloDetail
        titulo={tituloAbierto}
        personaActual={persona}
        personas={personas}
        onBack={() => setOpenRow(null)}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="page-kicker">La lista</span>
          <h2 style={{ marginTop: 8 }}>
            Nuestro <em>tablero</em>
          </h2>
        </div>
        <button
          onClick={clearPersona}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px 5px 5px",
            border: "1px solid var(--border)",
            borderRadius: 999,
            background: "transparent",
            color: "var(--text)",
            cursor: "pointer",
            flex: "none",
          }}
        >
          <span
            className="avatar avatar-sm"
            style={{ background: myColor.tint, color: myColor.color }}
          >
            {initialFor(persona)}
          </span>
          <span style={{ font: "600 11px/1 var(--font-body)" }}>{persona}</span>
        </button>
      </div>

      <div className="filter-bar">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            className={"filter-chip" + (filtroEstado === f.key ? " active" : "")}
            onClick={() => setFiltroEstado(f.key)}
          >
            <span className="dot" style={{ background: f.dot }} />
            {f.label}
            <span className="count">{f.count}</span>
          </button>
        ))}
      </div>
      <div className="filter-hr" />
      <div className="filter-bar kind">
        {KIND_FILTROS.map(([key, label]) => (
          <button
            key={key}
            className={"filter-chip" + (filtroTipo === key ? " active" : "")}
            onClick={() => setFiltroTipo(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading && (
        <div className="titulo-grid">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {!loading && titulosFiltrados.length === 0 && !error && (
        <div className="empty-state">No hay títulos que matcheen este filtro todavía.</div>
      )}

      {!loading && titulosFiltrados.length > 0 && (
        <>
          <div className="titulo-grid">
            {titulosFiltrados.map((t) => (
              <TituloCard
                key={t.row}
                titulo={t}
                personaActual={persona}
                personas={personas}
                onOpen={() => setOpenRow(t.row)}
              />
            ))}
          </div>
          <p className="count-line">
            {titulosFiltrados.length} de {titulos.length} títulos · toca una card para las notas
          </p>
        </>
      )}
    </div>
  );
}
