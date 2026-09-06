import ApiKeySheet from "../components/ApiKeySheet";
import Poster from "../components/Poster";
import { CREW, STATUS } from "../data";
import { countLine, useAppState } from "../state/AppStateContext";
import { buildCards } from "../state/selectors";
import type { KindFilter, StatusFilter } from "../types";
import "./TrackerScreen.css";

const STATUS_FILTERS: StatusFilter[] = ["todos", "pendiente", "mirando", "visto"];
const KIND_FILTERS: [KindFilter, string][] = [
  ["todo", "Series y películas"],
  ["Serie", "Series"],
  ["Película", "Películas"],
];

export default function TrackerScreen() {
  const {
    me,
    titles,
    statusFilter,
    kindFilter,
    setStatusFilter,
    setKindFilter,
    openDetail,
    goGate,
  } = useAppState();

  const meInfo = CREW.find((c) => c.id === me)!;
  const cards = buildCards(titles, statusFilter, kindFilter);
  const byStatus = (k: string) => titles.filter((t) => t.status === k).length;

  return (
    <div className="tracker">
      <div className="tracker-header">
        <div>
          <span className="tracker-kicker">La lista</span>
          <h2 className="tracker-title">
            Nuestro <em>tablero</em>
          </h2>
        </div>
        <div className="tracker-header-actions">
          <ApiKeySheet />
          <button className="tracker-profile" onClick={goGate}>
            <span
              className="tracker-profile-avatar"
              style={{ background: meInfo.tint, color: meInfo.color }}
            >
              {meInfo.initial}
            </span>
            <span>{meInfo.name}</span>
          </button>
        </div>
      </div>

      <div className="tracker-chips">
        {STATUS_FILTERS.map((k) => {
          const on = statusFilter === k;
          const label = k === "todos" ? "Todos" : STATUS[k].label;
          const count = k === "todos" ? titles.length : byStatus(k);
          const dot = k === "todos" ? "rgba(236,234,240,.25)" : STATUS[k].dot;
          return (
            <button
              key={k}
              className={"chip chip--status" + (on ? " chip--on" : "")}
              onClick={() => setStatusFilter(k)}
            >
              <span className="chip-dot" style={{ background: dot }} />
              {label}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="tracker-divider" />

      <div className="tracker-chips tracker-chips--kind">
        {KIND_FILTERS.map(([k, label]) => (
          <button
            key={k}
            className={"chip chip--kind" + (kindFilter === k ? " chip--kind-on" : "")}
            onClick={() => setKindFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tracker-grid">
        {cards.map((c) => (
          <button key={c.id} className="tracker-card" onClick={() => openDetail(c.id)}>
            <div className="tracker-card-poster">
              <Poster title={c.title} kind={c.kind as "Serie" | "Película"} showTitle={false} />
              <div className="tracker-card-scrim" />
              <div className="tracker-card-kind" style={{ color: c.kindColor }}>
                {c.kind}
              </div>
              <div className="tracker-card-overlay">
                <div className="tracker-card-name">{c.title}</div>
                <div className="tracker-card-status">
                  <span className="tracker-card-dot" style={{ background: c.dot }} />
                  {c.statusLine}
                </div>
                {c.watching && (
                  <div className="tracker-card-progress">
                    <div className="tracker-card-progress-fill" style={{ width: `${c.pct}%` }} />
                  </div>
                )}
              </div>
            </div>
            <div className="tracker-card-footer">
              <span className="tracker-card-marks">
                {c.marks.map((m, i) => (
                  <span
                    key={i}
                    className="tracker-card-mark"
                    style={{ background: m.bg, color: m.fg, borderColor: m.border }}
                  >
                    {m.label}
                  </span>
                ))}
              </span>
              <span className="tracker-card-platform">{c.platform}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="tracker-count">{countLine(titles.length, cards.length)}</p>
    </div>
  );
}
