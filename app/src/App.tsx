import Toast from "./components/Toast";
import TabBar from "./components/TabBar";
import { AppStateProvider, useAppState } from "./state/AppStateContext";
import GateScreen from "./screens/GateScreen";
import TrackerScreen from "./screens/TrackerScreen";
import DetailScreen from "./screens/DetailScreen";
import DiscoverScreen from "./screens/DiscoverScreen";
import StatsScreen from "./screens/StatsScreen";
import "./App.css";

function Screens() {
  const { screen } = useAppState();
  switch (screen) {
    case "gate":
      return <GateScreen />;
    case "tracker":
      return <TrackerScreen />;
    case "detail":
      return <DetailScreen />;
    case "discover":
      return <DiscoverScreen />;
    case "stats":
      return <StatsScreen />;
  }
}

function Shell() {
  const { screen } = useAppState();
  return (
    <div className="app-backdrop">
      <div className="app-frame">
        <Screens />
        {screen !== "gate" && <TabBar />}
        <Toast />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
