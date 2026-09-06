"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import type { Titulo } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { recomendar } from "@/lib/recommend";

export default function DashboardPage() {
  const { persona, personas } = usePersonContext();
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const recomendaciones = useMemo(
    () => (persona ? recomendar(titulos, persona, 4) : []),
    [titulos, persona]
  );

  const maxNota = 10;
  const maxDistribucion = Math.max(1, ...Object.values(stats.distribucionTipo));

  if (!persona) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stats</h1>
      </div>

      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          {recomendaciones.length > 0 && (
            <>
              <h2 className="section-title">Recomendado para {persona}</h2>
              {recomendaciones.map(({ titulo, motivo }) => (
                <div key={titulo.row} className="reco-card">
                  {titulo.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={titulo.poster} alt="" className="titulo-poster" />
                  )}
                  <div className="titulo-info">
                    <h3>{titulo.titulo}</h3>
                    <div className="titulo-meta">
                      {titulo.tipo && <span className="tag">{titulo.tipo}</span>}
                      {titulo.notaCritica != null && <span>Crítica: {titulo.notaCritica}</span>}
                    </div>
                    <p className="reco-reason">{motivo}</p>
                  </div>
                </div>
              ))}
            </>
          )}

          <h2 className="section-title">Resumen general</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalTitulos}</div>
              <div className="stat-label">Títulos cargados</div>
            </div>
            {Object.entries(stats.distribucionTipo).map(([tipo, cantidad]) => (
              <div className="stat-card" key={tipo}>
                <div className="stat-value">{cantidad}</div>
                <div className="stat-label">{tipo}s</div>
              </div>
            ))}
          </div>

          <h2 className="section-title">Distribución por tipo</h2>
          {Object.entries(stats.distribucionTipo).map(([tipo, cantidad]) => (
            <div className="bar-row" key={tipo}>
              <span className="bar-label">{tipo}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(cantidad / maxDistribucion) * 100}%` }}
                />
              </div>
              <span className="bar-value">{cantidad}</span>
            </div>
          ))}

          <h2 className="section-title">Notas por persona</h2>
          {stats.porPersona.map((p) => (
            <div key={p.persona} style={{ marginBottom: 16 }}>
              <div className="bar-row">
                <span className="bar-label">{p.persona}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${((p.promedioNota || 0) / maxNota) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{p.promedioNota != null ? p.promedioNota.toFixed(1) : "–"}</span>
              </div>
              <div className="bar-row">
                <span className="bar-label muted">vs. crítica</span>
                <div className="bar-track">
                  <div
                    className="bar-fill critica"
                    style={{ width: `${((p.promedioCriticaDeSusVistos || 0) / maxNota) * 100}%` }}
                  />
                </div>
                <span className="bar-value">
                  {p.promedioCriticaDeSusVistos != null ? p.promedioCriticaDeSusVistos.toFixed(1) : "–"}
                </span>
              </div>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {p.cantidadVista} vistas · {p.cantidadMirando} mirando · {p.cantidadPendiente} pendientes
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
