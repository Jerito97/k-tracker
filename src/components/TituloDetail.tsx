"use client";

import { useState } from "react";
import type { Estado, Titulo } from "@/lib/types";
import { ESTADOS } from "@/lib/types";
import { colorFor, initialFor } from "@/lib/palette";
import { useToast } from "@/context/ToastContext";

function kindColor(tipo: string): string {
  return tipo === "Película" ? "#d6849b" : "var(--accent-2)";
}

interface Props {
  titulo: Titulo;
  personaActual: string;
  personas: string[];
  onBack: () => void;
  onUpdate: (row: number, campo: "estado" | "nota", valor: string | number) => Promise<void>;
  onUpdatePoster: (row: number, url: string) => Promise<void>;
}

export function TituloDetail({ titulo, personaActual, personas, onBack, onUpdate, onUpdatePoster }: Props) {
  const { showToast } = useToast();
  const miEstadoActual = titulo.personas[personaActual]?.estado || "Pendiente";
  const [nota, setNota] = useState<number>(titulo.personas[personaActual]?.nota ?? 0);
  const [editandoPoster, setEditandoPoster] = useState(false);
  const [posterUrl, setPosterUrl] = useState(titulo.poster || "");
  const [guardandoPoster, setGuardandoPoster] = useState(false);

  const notas = personas
    .map((nombre) => titulo.personas[nombre]?.nota)
    .filter((n): n is number => n != null && n > 0);
  const avg = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : "—";

  async function handleEstadoChange(nuevoEstado: Estado) {
    try {
      await onUpdate(titulo.row, "estado", nuevoEstado);
      showToast(`${nuevoEstado} · guardado`);
    } catch {
      showToast("No se pudo guardar");
    }
  }

  async function handleNotaChange(v: number) {
    setNota(v);
    try {
      await onUpdate(titulo.row, "nota", v);
    } catch {
      showToast("No se pudo guardar la nota");
    }
  }

  async function handleGuardarPoster() {
    setGuardandoPoster(true);
    try {
      await onUpdatePoster(titulo.row, posterUrl.trim());
      showToast("Póster actualizado");
      setEditandoPoster(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo guardar el póster");
    } finally {
      setGuardandoPoster(false);
    }
  }

  return (
    <div className="detail-overlay">
      <div className="detail-hero">
        {titulo.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={titulo.poster} alt="" className="detail-hero-img" />
        ) : null}
        <div className="detail-hero-scrim" />
        <button className="detail-back" onClick={onBack}>
          ←
        </button>
        <div className="detail-hero-text">
          {titulo.tipo && (
            <span className="detail-kind" style={{ color: kindColor(titulo.tipo) }}>
              {titulo.tipo}
            </span>
          )}
          <h2>{titulo.titulo}</h2>
        </div>
      </div>

      <div className="detail-body">
        {!editandoPoster ? (
          <button
            onClick={() => setEditandoPoster(true)}
            style={{
              border: "none",
              background: "none",
              color: "var(--text-faint)",
              font: "500 11px/1 var(--font-body)",
              cursor: "pointer",
              padding: 0,
              marginBottom: 16,
            }}
          >
            {titulo.poster ? "¿Póster equivocado? Corregirlo" : "+ Agregar póster manualmente"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <input
              className="search-input"
              placeholder="URL de la imagen"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              style={{ fontSize: 12 }}
            />
            <button
              onClick={handleGuardarPoster}
              disabled={guardandoPoster}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "var(--accent)",
                color: "var(--frame-bg)",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {guardandoPoster ? "..." : "Guardar"}
            </button>
          </div>
        )}

        {titulo.resumen && <p className="detail-synopsis">{titulo.resumen}</p>}

        <div className="detail-score-row">
          <div className="detail-score-avg">
            <div className="detail-score-avg-num">{avg}</div>
            <div className="detail-score-label">La mesa</div>
          </div>
          {titulo.notaCritica != null && (
            <div>
              <div className="detail-critic-label">Nota crítica</div>
              <p className="detail-critic-quote">{titulo.notaCritica}/10</p>
            </div>
          )}
        </div>

        <h3 className="detail-h3">Notas de la mesa</h3>
        <div className="notes-list">
          {personas.map((nombre, i) => {
            const c = colorFor(i);
            const n = titulo.personas[nombre]?.nota;
            const scoreLabel = n != null && n > 0 ? `${n}/10` : "sin nota";
            const pct = n ? n * 10 : 0;
            return (
              <div key={nombre} className="note-row">
                <div
                  className="avatar avatar-sm"
                  style={{ background: c.tint, boxShadow: `inset 0 0 0 1px ${c.color}`, color: c.color }}
                >
                  {initialFor(nombre)}
                </div>
                <div className="note-info">
                  <div className="note-head">
                    <span className="note-name">{nombre}</span>
                    <span className="note-score" style={{ color: c.color }}>
                      {scoreLabel}
                    </span>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-fill" style={{ background: c.color, width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="my-box">
          <div className="my-box-label">Lo tuyo, {personaActual}</div>
          <div className="status-opts">
            {ESTADOS.map((e) => (
              <button
                key={e}
                className={"status-opt" + (miEstadoActual === e ? " active" : "")}
                onClick={() => handleEstadoChange(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="my-score-row">
            <span className="my-score-label">Tu nota</span>
            <span className="my-score-value">{nota > 0 ? `${nota}/10` : "—"}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={nota}
            onChange={(e) => handleNotaChange(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div className="range-caption">
            <span>sin nota</span>
            <span>obra maestra</span>
          </div>
        </div>
      </div>
    </div>
  );
}
