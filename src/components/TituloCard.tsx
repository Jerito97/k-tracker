"use client";

import { useState } from "react";
import type { Estado, Titulo } from "@/lib/types";
import { ESTADOS } from "@/lib/types";

interface Props {
  titulo: Titulo;
  personaActual: string;
  onUpdate: (row: number, campo: "estado" | "nota", valor: string | number) => Promise<void>;
}

export function TituloCard({ titulo, personaActual, onUpdate }: Props) {
  const miEstado = titulo.personas[personaActual];
  const [estado, setEstado] = useState<Estado | "">(miEstado?.estado || "Pendiente");
  const [nota, setNota] = useState<string>(miEstado?.nota != null ? String(miEstado.nota) : "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleEstadoChange(nuevoEstado: Estado) {
    setEstado(nuevoEstado);
    setStatus("saving");
    try {
      await onUpdate(titulo.row, "estado", nuevoEstado);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  async function handleNotaBlur() {
    if (nota === "" || nota == null) return;
    const n = parseFloat(nota.replace(",", "."));
    if (Number.isNaN(n)) return;
    setStatus("saving");
    try {
      await onUpdate(titulo.row, "nota", n);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  const otras = Object.entries(titulo.personas).filter(([nombre]) => nombre !== personaActual);

  return (
    <article className="titulo-card">
      <div className="titulo-card-head">
        {titulo.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={titulo.poster} alt="" className="titulo-poster" />
        )}
        <div className="titulo-info">
          <h3>{titulo.titulo}</h3>
          <div className="titulo-meta">
            {titulo.tipo && <span className="tag">{titulo.tipo}</span>}
            {titulo.notaCritica != null && <span>Crítica: {titulo.notaCritica}</span>}
            {titulo.promedio != null && <span>Promedio: {titulo.promedio.toFixed(1)}</span>}
          </div>
          {titulo.resumen && <p className="titulo-resumen">{titulo.resumen}</p>}
        </div>
      </div>

      <div className="mi-control">
        <select
          className="estado-select"
          data-estado={estado}
          value={estado}
          onChange={(e) => handleEstadoChange(e.target.value as Estado)}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          className="nota-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={10}
          step={0.5}
          placeholder="Nota"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onBlur={handleNotaBlur}
        />
        <span className={`save-status ${status}`}>
          {status === "saving" && "Guardando..."}
          {status === "saved" && "Guardado ✓"}
          {status === "error" && "Error al guardar"}
        </span>
      </div>

      {otras.length > 0 && (
        <div className="otras-personas">
          {otras.map(([nombre, info]) => (
            <span key={nombre} className="mini-pill">
              {nombre}: {info.estado || "Pendiente"}
              {info.nota != null ? ` (${info.nota})` : ""}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
