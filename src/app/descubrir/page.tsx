"use client";

import { useEffect, useMemo, useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import { useToast } from "@/context/ToastContext";
import type { OmdbResultado } from "@/lib/omdb";
import type { Titulo } from "@/lib/types";
import { recomendar } from "@/lib/recommend";

type AddState = "idle" | "adding" | "added" | "error";

export default function DescubrirPage() {
  const { persona } = usePersonContext();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<OmdbResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});

  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loadingTitulos, setLoadingTitulos] = useState(true);

  useEffect(() => {
    async function cargar() {
      setLoadingTitulos(true);
      try {
        const res = await fetch("/api/titles");
        const data = await res.json();
        if (res.ok) setTitulos(data.titulos || []);
      } finally {
        setLoadingTitulos(false);
      }
    }
    cargar();
  }, []);

  const recomendaciones = useMemo(
    () => (persona ? recomendar(titulos, persona, 4) : []),
    [titulos, persona]
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBuscando(true);
    setSearchError(null);
    setResultados([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al buscar");
      setResultados(data.resultados || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setBuscando(false);
    }
  }

  async function handleAgregar(resultado: OmdbResultado) {
    setAddStates((prev) => ({ ...prev, [resultado.imdbID]: "adding" }));
    try {
      const detalleRes = await fetch(`/api/search?imdbID=${encodeURIComponent(resultado.imdbID)}`);
      const detalleData = await detalleRes.json();
      if (!detalleRes.ok) throw new Error(detalleData.error || "No se pudo obtener el detalle");
      const detalle = detalleData.detalle;

      const notaCritica =
        detalle.imdbRating && detalle.imdbRating !== "N/A" ? parseFloat(detalle.imdbRating) : null;

      const addRes = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: resultado.Title,
          tipo: resultado.Type === "series" ? "Serie" : "Película",
          resumen: detalle.Plot && detalle.Plot !== "N/A" ? detalle.Plot : "",
          notaCritica,
          poster: resultado.Poster !== "N/A" ? resultado.Poster : undefined,
        }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) throw new Error(addData.error || "No se pudo agregar el título");
      setAddStates((prev) => ({ ...prev, [resultado.imdbID]: "added" }));
      showToast(`"${resultado.Title}" a Pendientes`);
    } catch {
      setAddStates((prev) => ({ ...prev, [resultado.imdbID]: "error" }));
      showToast("No se pudo agregar");
    }
  }

  return (
    <div className="page">
      <span className="page-kicker">Descubrimiento</span>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 38, margin: "8px 0 18px" }}>
        Para la <em style={{ fontStyle: "italic", color: "var(--accent)" }}>próxima</em> ronda
      </h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          className="search-input"
          placeholder="Buscar un título en OMDb..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={buscando || query.trim().length < 2}>
          {buscando ? "..." : "Buscar"}
        </button>
      </form>

      {searchError && <p className="error-text">{searchError}</p>}

      {resultados.length > 0 && (
        <>
          <div className="discover-list" style={{ marginBottom: 28 }}>
            {resultados.map((r) => {
              const estado = addStates[r.imdbID] || "idle";
              return (
                <div key={r.imdbID} className="discover-card">
                  <div className="discover-poster">
                    {r.Poster !== "N/A" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.Poster}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div className="discover-info">
                    <span className="discover-kind" style={{ color: "var(--accent-2)" }}>
                      {r.Type === "series" ? "Serie" : "Película"} · {r.Year}
                    </span>
                    <div className="discover-title">{r.Title}</div>
                    <button
                      className={"discover-btn" + (estado === "added" ? " added" : "")}
                      disabled={estado === "adding" || estado === "added"}
                      onClick={() => handleAgregar(r)}
                    >
                      {estado === "idle" && "+ Agregar a la lista"}
                      {estado === "adding" && "Agregando..."}
                      {estado === "added" && "En la lista ✓"}
                      {estado === "error" && "Reintentar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="muted" style={{ marginBottom: 22, maxWidth: 300 }}>
        Elegidas mirando lo que {persona} puntuó alto. Si no les gusta, se quejan con el algoritmo.
      </p>

      {loadingTitulos && <p className="muted">Cargando recomendaciones...</p>}

      {!loadingTitulos && recomendaciones.length === 0 && (
        <p className="muted">No hay pendientes para recomendar todavía — ¡buscá algo arriba!</p>
      )}

      <div className="discover-list">
        {recomendaciones.map(({ titulo, motivo }) => (
          <div key={titulo.row} className="discover-card">
            <div className="discover-poster">
              {titulo.poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={titulo.poster}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div className="discover-info">
              {titulo.tipo && (
                <span className="discover-kind" style={{ color: "var(--accent-2)" }}>
                  {titulo.tipo}
                </span>
              )}
              <div className="discover-title">{titulo.titulo}</div>
              <p className="discover-why">{motivo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
