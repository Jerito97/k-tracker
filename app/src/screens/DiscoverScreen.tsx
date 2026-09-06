import Poster from "../components/Poster";
import { DISCOVER, kindColor } from "../data";
import { useAppState } from "../state/AppStateContext";
import "./DiscoverScreen.css";

export default function DiscoverScreen() {
  const { addedDiscover, addDiscoverItem } = useAppState();

  return (
    <div className="discover">
      <span className="discover-kicker">Descubrimiento</span>
      <h2 className="discover-title">
        Para la <em>próxima</em> ronda
      </h2>
      <p className="discover-intro">
        Elegidas mirando lo que cada una puntuó alto. Si no les gusta, se quejan con el algoritmo.
      </p>
      <div className="discover-list">
        {DISCOVER.map((d) => {
          const added = addedDiscover.includes(d.id);
          return (
            <div key={d.id} className="discover-card">
              <div className="discover-thumb">
                <Poster title={d.title} year={d.year} kind={d.kind} showTitle />
              </div>
              <div className="discover-body">
                <span className="discover-kind" style={{ color: kindColor(d.kind) }}>
                  {d.kind} · {d.year}
                </span>
                <div className="discover-name">{d.title}</div>
                <p className="discover-why">{d.why}</p>
                <button
                  className={"discover-add" + (added ? " discover-add--on" : "")}
                  onClick={() => addDiscoverItem(d.id, d.title)}
                >
                  {added ? "En la lista ✓" : "+ Agregar a la lista"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
