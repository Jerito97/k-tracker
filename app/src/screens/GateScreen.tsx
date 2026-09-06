import { CREW } from "../data";
import { LAST_ACTIVITY, useAppState } from "../state/AppStateContext";
import "./GateScreen.css";

export default function GateScreen() {
  const { pickProfile } = useAppState();

  return (
    <div className="gate">
      <div className="gate-brand">
        <span className="gate-brand-mark" />
        <span className="gate-brand-name">K-Tracker</span>
      </div>
      <h1 className="gate-title">
        Elegí tu
        <br />
        <em>perfil</em>
      </h1>
      <div className="gate-list">
        {CREW.map((p) => (
          <button key={p.id} className="gate-person" onClick={() => pickProfile(p.id)}>
            <span
              className="gate-avatar"
              style={{ background: p.tint, boxShadow: `inset 0 0 0 1px ${p.color}`, color: p.color }}
            >
              {p.initial}
            </span>
            <span className="gate-person-meta">
              <span className="gate-person-name">{p.name}</span>
              <span className="gate-person-tag">{p.tag}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="gate-last">Última actividad del grupo: {LAST_ACTIVITY}</p>
    </div>
  );
}
