import { useAppState } from "../state/AppStateContext";
import "./Toast.css";

export default function Toast() {
  const { toast, toastNonce } = useAppState();
  if (!toast) return null;
  return (
    <div className="toast" key={toastNonce}>
      {toast}
    </div>
  );
}
