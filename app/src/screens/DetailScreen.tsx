import Poster from "../components/Poster";
import { STATUS } from "../data";
import { useAppState } from "../state/AppStateContext";
import { buildDetail } from "../state/selectors";
import type { Status } from "../types";
import "./DetailScreen.css";

const STATUS_OPTS: Status[] = ["pendiente", "mirando", "visto"];

export default function DetailScreen() {
  const { titles, detailId, me, backToTracker, setTitleStatus, setScore, bumpEpisode } =
    useAppState();
  const d = buildDetail(titles, detailId, me);
  const currentStatus = d.status;

  return (
    <div className="detail">
      <div className="detail-hero">
        <Poster title={d.title} year={d.year} kind={d.kind as "Serie" | "Película"} showTitle={false} />
        <div className="detail-hero-scrim" />
        <button className="detail-back" onClick={backToTracker} aria-label="Volver">
          ←
        </button>
        <div className="detail-hero-text">
          <span className="detail-hero-kind" style={{ color: d.kindColor }}>
            {d.kind} · {d.year}
          </span>
          <h2 className="detail-hero-title">{d.title}</h2>
          <span className="detail-hero-orig">{d.orig}</span>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-chips">
          {d.chips.map((ch, i) => (
            <span key={i} className="detail-chip">
              {ch}
            </span>
          ))}
        </div>
        <p className="detail-synopsis">{d.synopsis}</p>

        <div className="detail-stats-box">
          <div className="detail-avg">
            <div className="detail-avg-num">{d.avg}</div>
            <div className="detail-avg-label">La mesa</div>
          </div>
          {d.critic && (
            <div className="detail-critic">
              <div className="detail-critic-label">Nota crítica · {d.critic.score}</div>
              <p className="detail-critic-quote">&ldquo;{d.critic.quote}&rdquo;</p>
            </div>
          )}
        </div>

        <h3 className="detail-notes-title">Notas de la mesa</h3>
        <div className="detail-notes">
          {d.notes.map((n) => (
            <div key={n.id} className="detail-note">
              <span className="detail-note-avatar" style={{ background: n.tint, boxShadow: `inset 0 0 0 1px ${n.color}`, color: n.color }}>
                {n.initial}
              </span>
              <div className="detail-note-body">
                <div className="detail-note-head">
                  <span className="detail-note-name">{n.name}</span>
                  <span className="detail-note-score" style={{ color: n.color }}>
                    {n.scoreLabel}
                  </span>
                  <span className="detail-note-when">{n.when}</span>
                </div>
                <div className="detail-note-bar">
                  <div className="detail-note-bar-fill" style={{ background: n.color, width: `${n.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="detail-mine">
          <div className="detail-mine-label">Lo tuyo</div>
          <div className="detail-mine-status">
            {STATUS_OPTS.map((s) => {
              const on = currentStatus === s;
              return (
                <button
                  key={s}
                  className={"detail-mine-status-btn" + (on ? " detail-mine-status-btn--on" : "")}
                  onClick={() => setTitleStatus(d.id, s)}
                >
                  {STATUS[s].label}
                </button>
              );
            })}
          </div>
          <div className="detail-mine-score-row">
            <span className="detail-mine-score-label">Tu nota</span>
            <span className="detail-mine-score-value">{d.myScoreLabel}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={d.myScore}
            onChange={(e) => setScore(d.id, me, Number(e.target.value))}
            className="detail-mine-slider"
          />
          <div className="detail-mine-slider-ends">
            <span>sin nota</span>
            <span>obra maestra</span>
          </div>
          {d.watching && (
            <div className="detail-mine-ep">
              <div className="detail-mine-ep-progress">
                <div className="detail-mine-ep-label">
                  Episodio {d.ep} de {d.epTotal}
                </div>
                <div className="detail-mine-ep-bar">
                  <div className="detail-mine-ep-bar-fill" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
              <button className="detail-mine-ep-btn" onClick={() => bumpEpisode(d.id)}>
                +1 ep
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
