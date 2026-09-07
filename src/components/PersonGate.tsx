"use client";

import { useState } from "react";
import { usePersonContext } from "@/context/PersonContext";
import { colorFor, initialFor } from "@/lib/palette";

export function PersonGate({ children }: { children: React.ReactNode }) {
  const { persona, personas, loadingPersonas, error, setPersona, addPersona } = usePersonContext();
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (persona) return <>{children}</>;

  async function handleAddNueva(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await addPersona(nuevoNombre.trim());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="person-gate">
      <div className="person-gate-brand">
        <div className="person-gate-brand-dot" />
        <span>K-Tracker</span>
      </div>
      <h1>
        Elegí tu
        <br />
        <em>perfil</em>
      </h1>

      {loadingPersonas && <p className="muted">Cargando...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loadingPersonas && !error && (
        <div className="person-grid">
          {personas.map((nombre, i) => {
            const c = colorFor(i);
            return (
              <button key={nombre} className="person-btn" onClick={() => setPersona(nombre)}>
                <div
                  className="avatar"
                  style={{ background: c.tint, boxShadow: `inset 0 0 0 1px ${c.color}`, color: c.color }}
                >
                  {initialFor(nombre)}
                </div>
                <span className="person-btn-info">
                  <span className="person-btn-name">{nombre}</span>
                  <span className="person-btn-tag">Tocá para entrar</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!addingNew ? (
        <button className="link-btn" onClick={() => setAddingNew(true)}>
          + Soy nueva por acá
        </button>
      ) : (
        <form onSubmit={handleAddNueva} className="add-person-form">
          <input
            autoFocus
            placeholder="Tu nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            maxLength={40}
          />
          <button type="submit" disabled={submitting || !nuevoNombre.trim()}>
            {submitting ? "Agregando..." : "Agregarme"}
          </button>
          {formError && <p className="error-text">{formError}</p>}
        </form>
      )}
    </div>
  );
}
