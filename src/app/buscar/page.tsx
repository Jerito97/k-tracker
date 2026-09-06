"use client";

import { useState } from "react";
import type { OmdbResultado } from "@/lib/omdb";

type AddState = "idle" | "adding" | "added" | "error";

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<OmdbResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setResultados([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al buscar");
      setResultados(data.resultados || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
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
    } catch {
      setAddStates((prev) => ({ ...prev, [resultado.imdbID]: "error" }));
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Buscar y agregar</h1>
      </div>
      <p className="muted">Buscá un título en OMDb y agregalo a la lista como Pendiente para todas.</p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          className="search-input"
          placeholder="Ej: Crash Landing on You"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {!loading && resultados.length === 0 && query && !error && (
        <p className="muted">Sin resultados para &quot;{query}&quot;.</p>
      )}

      <div className="search-results">
        {resultados.map((r) => {
          const estado = addStates[r.imdbID] || "idle";
          return (
            <div key={r.imdbID} className="search-result-card">
              {r.Poster !== "N/A" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.Poster} alt="" className="titulo-poster" />
              ) : (
                <div className="titulo-poster" />
              )}
              <div className="titulo-info">
                <h3>{r.Title}</h3>
                <div className="titulo-meta">
                  <span className="tag">{r.Type === "series" ? "Serie" : "Película"}</span>
                  <span>{r.Year}</span>
                </div>
              </div>
              <button
                className="add-btn"
                disabled={estado === "adding" || estado === "added"}
                onClick={() => handleAgregar(r)}
              >
                {estado === "idle" && "Agregar"}
                {estado === "adding" && "Agregando..."}
                {estado === "added" && "Agregado ✓"}
                {estado === "error" && "Reintentar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
