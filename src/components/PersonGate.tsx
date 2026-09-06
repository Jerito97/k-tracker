"use client";

import { useState } from "react";
import { usePersonContext } from "@/context/PersonContext";

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
      <div className="person-gate-card">
        <h1>¿Quién sos?</h1>
        <p className="muted">Elegí tu nombre para trackear tus k-dramas.</p>

        {loadingPersonas && <p className="muted">Cargando...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loadingPersonas && !error && (
          <div className="person-grid">
            {personas.map((nombre) => (
              <button key={nombre} className="person-btn" onClick={() => setPersona(nombre)}>
                {nombre}
              </button>
            ))}
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
    </div>
  );
}
