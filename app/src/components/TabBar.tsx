import { useAppState } from "../state/AppStateContext";
import "./TabBar.css";

const TABS: { screen: "tracker" | "discover" | "stats"; label: string; icon: string }[] = [
  { screen: "tracker", label: "Tablero", icon: "▦" },
  { screen: "discover", label: "Descubrir", icon: "✦" },
  { screen: "stats", label: "Stats", icon: "◔" },
];

export default function TabBar() {
  const { screen, goTracker, goDiscover, goStats } = useAppState();
  const go = { tracker: goTracker, discover: goDiscover, stats: goStats };

  return (
    <div className="tab-bar">
      {TABS.map((t) => {
        const active = screen === t.screen || (t.screen === "tracker" && screen === "detail");
        return (
          <button
            key={t.screen}
            className={"tab-btn" + (active ? " tab-btn--active" : "")}
            onClick={go[t.screen]}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
