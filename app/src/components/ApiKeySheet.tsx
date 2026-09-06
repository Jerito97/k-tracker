import { useState } from "react";
import { useAppState } from "../state/AppStateContext";
import "./ApiKeySheet.css";

export default function ApiKeySheet() {
  const { omdbApiKey, setOmdbApiKey } = useAppState();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(omdbApiKey);

  return (
    <>
      <button
        className="apikey-trigger"
        onClick={() => {
          setDraft(omdbApiKey);
          setOpen(true);
        }}
        aria-label="Configurar pósters"
        title="Configurar pósters"
      >
        ⚙
      </button>
      {open && (
        <div className="apikey-backdrop" onClick={() => setOpen(false)}>
          <div className="apikey-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="apikey-title">Pósters reales</div>
            <p className="apikey-copy">
              Pegá una API key gratuita de{" "}
              <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer">
                OMDb
              </a>{" "}
              para traer pósters de verdad. Sin key, cada título muestra su propia carátula
              tipográfica.
            </p>
            <input
              className="apikey-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pegá tu API key"
              autoFocus
            />
            <div className="apikey-actions">
              <button
                className="apikey-btn apikey-btn--ghost"
                onClick={() => {
                  setOmdbApiKey("");
                  setDraft("");
                }}
              >
                Quitar
              </button>
              <button
                className="apikey-btn apikey-btn--primary"
                onClick={() => {
                  setOmdbApiKey(draft.trim());
                  setOpen(false);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
