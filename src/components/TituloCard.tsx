"use client";

import type { Titulo } from "@/lib/types";
import { colorFor, initialFor } from "@/lib/palette";

const STATUS_DOT: Record<string, string> = {
  Pendiente: "rgba(236,234,240,.4)",
  Mirando: "var(--accent)",
  Visto: "var(--accent-2)",
};

function kindColor(tipo: string): string {
  return tipo === "Película" ? "#d6849b" : "var(--accent-2)";
}

interface Props {
  titulo: Titulo;
  personaActual: string;
  personas: string[];
  onOpen: () => void;
}

export function TituloCard({ titulo, personaActual, personas, onOpen }: Props) {
  const estadoLabel = (personaNombre: string) => titulo.personas[personaNombre]?.estado || "Pendiente";
  const miEstado = estadoLabel(personaActual);

  return (
    <button className="titulo-card" onClick={onOpen}>
      <div className="titulo-poster-wrap">
        {titulo.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={titulo.poster} alt="" className="titulo-poster-img" />
        ) : (
          <div className="titulo-poster-placeholder">{titulo.titulo}</div>
        )}
        <div className="titulo-poster-scrim" />
        {titulo.tipo && (
          <div className="titulo-kind-badge" style={{ color: kindColor(titulo.tipo) }}>
            {titulo.tipo}
          </div>
        )}
        <div className="titulo-overlay">
          <div className="titulo-overlay-title">{titulo.titulo}</div>
          <div className="titulo-overlay-status">
            <span className="dot" style={{ background: STATUS_DOT[miEstado] || STATUS_DOT.Pendiente }} />
            {miEstado}
          </div>
        </div>
      </div>
      <div className="titulo-card-footer">
        <span className="marks">
          {personas.map((nombre, i) => {
            const c = colorFor(i);
            const nota = titulo.personas[nombre]?.nota;
            const rated = nota != null;
            return (
              <span
                key={nombre}
                className="mark"
                style={{
                  background: rated ? c.color : "transparent",
                  color: rated ? "var(--frame-bg)" : "var(--text-faint)",
                  borderColor: rated ? c.color : "var(--border)",
                }}
                title={`${nombre}: ${estadoLabel(nombre)}`}
              >
                {rated ? nota : initialFor(nombre)}
              </span>
            );
          })}
        </span>
        {titulo.notaCritica != null && <span className="platform-label">Crítica {titulo.notaCritica}</span>}
      </div>
    </button>
  );
}
