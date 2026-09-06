import { statsFootnote, useAppState } from "../state/AppStateContext";
import { buildMonthCols, buildPeopleStats, buildPodium } from "../state/selectors";
import type { StatsVariant } from "../types";
import "./StatsScreen.css";

const VARIANTS: [StatsVariant, string][] = [
  ["v1", "Barras"],
  ["v2", "Anillos"],
  ["v3", "Cintas"],
];

export default function StatsScreen() {
  const { titles, statsVariant, setStatsVariant } = useAppState();
  const people = buildPeopleStats(titles);
  const monthCols = buildMonthCols();
  const podium = buildPodium(people);
  const closedCount = titles.filter((t) => t.status === "visto").length;

  return (
    <div className="stats">
      <span className="stats-kicker">Temporada 2026</span>
      <h2 className="stats-title">
        Quién <em>mira</em> más
      </h2>

      <div className="stats-variant-toggle">
        {VARIANTS.map(([k, label]) => (
          <button
            key={k}
            className={"stats-variant-btn" + (statsVariant === k ? " stats-variant-btn--on" : "")}
            onClick={() => setStatsVariant(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {statsVariant === "v1" && (
        <div className="stats-panel">
          <div className="stats-section-label">Títulos terminados · de {closedCount} cerrados</div>
          <div className="stats-v1-list">
            {people.map((p) => (
              <div key={p.id}>
                <div className="stats-v1-row">
                  <span className="stats-v1-name">{p.name}</span>
                  <span className="stats-v1-avg">{p.avgLabel}</span>
                  <span className="stats-v1-watched" style={{ color: p.color }}>
                    {p.watched}
                  </span>
                </div>
                <div className="stats-v1-bar">
                  <div
                    className="stats-v1-bar-fill"
                    style={{ background: `linear-gradient(90deg,${p.color},${p.colorSoft})`, width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="stats-section-label">Actividad por mes</div>
          <div className="stats-v1-chart">
            {monthCols.map((m) => (
              <div key={m.label} className="stats-v1-col">
                <div className="stats-v1-col-bars">
                  {m.segs.map((s, i) => (
                    <div key={i} className="stats-v1-seg" style={{ background: s.color, height: `${s.h}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="stats-v1-labels">
            {monthCols.map((m) => (
              <div key={m.label} className="stats-v1-col-label">
                {m.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {statsVariant === "v2" && (
        <div className="stats-panel">
          <div className="stats-v2-rings">
            {people.map((p) => (
              <div key={p.id} className="stats-v2-person">
                <div className="stats-v2-ring" style={{ background: p.ring }}>
                  <div className="stats-v2-ring-hole" />
                  <div className="stats-v2-ring-content">
                    <div className="stats-v2-ring-num" style={{ color: p.color }}>
                      {p.watched}
                    </div>
                    <div className="stats-v2-ring-label">vistos</div>
                  </div>
                </div>
                <span className="stats-v2-name">{p.name}</span>
                <span className="stats-v2-streak">{p.streakLabel}</span>
              </div>
            ))}
          </div>

          <div className="stats-section-label">Racha mes a mes</div>
          <div className="stats-v2-heat">
            {people.map((p) => (
              <div key={p.id} className="stats-v2-heat-row">
                <span className="stats-v2-heat-short">{p.short}</span>
                <div className="stats-v2-heat-cells">
                  {p.heat.map((h, i) => (
                    <div key={i} className="stats-v2-heat-cell" style={{ background: h.bg, color: h.fg }}>
                      {h.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="stats-v2-heat-row">
              <span className="stats-v2-heat-short" />
              <div className="stats-v2-heat-cells">
                {monthCols.map((m) => (
                  <div key={m.label} className="stats-v2-heat-month">
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {statsVariant === "v3" && (
        <div className="stats-panel">
          <div className="stats-v3-podium">
            {podium.map((p) => (
              <div key={p.id} className="stats-v3-person">
                <span className="stats-v3-num" style={{ color: p.color }}>
                  {p.watched}
                </span>
                <div
                  className="stats-v3-bar"
                  style={{ background: `linear-gradient(180deg,${p.color},${p.colorSoft})`, height: `${p.h}px` }}
                >
                  <span className="stats-v3-place">{p.place}</span>
                </div>
                <span className="stats-v3-name">{p.name}</span>
              </div>
            ))}
          </div>

          <div className="stats-section-label">Cintas del semestre</div>
          <div className="stats-v3-chart">
            {monthCols.map((m) => (
              <div key={m.label} className="stats-v3-col">
                <div className="stats-v3-stack">
                  {m.stack.map((s, i) => (
                    <div key={i} className="stats-v3-ribbon" style={{ background: s.color, height: `${s.h}%` }} />
                  ))}
                </div>
                <div className="stats-v3-col-label">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="stats-v3-legend">
            {people.map((p) => (
              <span key={p.id} className="stats-v3-legend-item">
                <span className="stats-v3-legend-dot" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="stats-footnote">{statsFootnote(titles.length)}</p>
    </div>
  );
}
