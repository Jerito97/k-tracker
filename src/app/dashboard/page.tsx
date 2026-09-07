"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import type { Titulo } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { colorFor } from "@/lib/palette";

type Variant = "vistos" | "critica";

export default function DashboardPage() {
  const { persona, personas } = usePersonContext();
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("vistos");

  useEffect(() => {
    async function cargar() {
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
    cargar();
  }, []);

  const stats = useMemo(() => computeStats(titulos, personas), [titulos, personas]);
  const maxWatched = Math.max(1, ...stats.porPersona.map((p) => p.cantidadVista));

  if (!persona) return null;

  return (
    <div className="page">
      <span className="page-kicker">Estadísticas</span>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 38, margin: "8px 0 18px" }}>
        Quién <em style={{ fontStyle: "italic", color: "var(--accent)" }}>mira</em> más
      </h2>

      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <div className="stat-tiles">
            <div className="stat-tile">
              <div className="stat-tile-value">{stats.totalTitulos}</div>
              <div className="stat-tile-label">Títulos cargados</div>
            </div>
            {Object.entries(stats.distribucionTipo).map(([tipo, cantidad]) => (
              <div className="stat-tile" key={tipo}>
                <div className="stat-tile-value">{cantidad}</div>
                <div className="stat-tile-label">{tipo}s</div>
              </div>
            ))}
          </div>

          <div className="stats-toggle">
            <button className={variant === "vistos" ? "active" : ""} onClick={() => setVariant("vistos")}>
              Vistos
            </button>
            <button className={variant === "critica" ? "active" : ""} onClick={() => setVariant("critica")}>
              Vs. crítica
            </button>
          </div>

          {variant === "vistos" && (
            <>
              <div className="stats-section-label">Títulos vistos por persona</div>
              {stats.porPersona.map((p) => {
                const c = colorFor(personas.indexOf(p.persona));
                return (
                  <div key={p.persona} className="person-bar-row">
                    <div className="person-bar-head">
                      <span className="person-bar-name">{p.persona}</span>
                      <span className="person-bar-sub">
                        {p.promedioNota != null ? `promedio ${p.promedioNota.toFixed(1)}` : "sin notas"}
                      </span>
                      <span className="person-bar-value" style={{ color: c.color }}>
                        {p.cantidadVista}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(p.cantidadVista / maxWatched) * 100}%`,
                          background: `linear-gradient(90deg, ${c.color}, ${c.colorSoft})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {variant === "critica" && (
            <>
              <div className="stats-section-label">Tu nota vs. la crítica</div>
              {stats.porPersona.map((p) => {
                const c = colorFor(personas.indexOf(p.persona));
                return (
                  <div key={p.persona} className="person-bar-row">
                    <div className="person-bar-head">
                      <span className="person-bar-name">{p.persona}</span>
                      <span className="person-bar-value" style={{ color: c.color }}>
                        {p.promedioNota != null ? p.promedioNota.toFixed(1) : "–"}
                      </span>
                    </div>
                    <div className="bar-track" style={{ marginBottom: 6 }}>
                      <div
                        className="bar-fill"
                        style={{ width: `${((p.promedioNota || 0) / 10) * 100}%`, background: c.color }}
                      />
                    </div>
                    <div className="person-bar-head" style={{ marginBottom: 4 }}>
                      <span className="person-bar-sub">vs. crítica</span>
                      <span className="person-bar-value" style={{ fontSize: 18, color: "var(--text-faint)" }}>
                        {p.promedioCriticaDeSusVistos != null ? p.promedioCriticaDeSusVistos.toFixed(1) : "–"}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${((p.promedioCriticaDeSusVistos || 0) / 10) * 100}%`,
                          background: "var(--text-faint)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <p className="stats-footnote">
            Sobre {stats.totalTitulos} títulos cargados en la sheet compartida.
          </p>
        </>
      )}
    </div>
  );
}
