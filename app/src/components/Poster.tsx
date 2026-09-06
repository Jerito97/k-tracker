import { usePoster } from "../lib/omdb";
import { useAppState } from "../state/AppStateContext";
import type { Kind } from "../types";
import "./Poster.css";

interface PosterProps {
  title: string;
  year?: number;
  kind: Kind;
  /** Draw the title inside the fallback cover. Off when the parent already
   *  overlays the title on top of the poster (tracker cards, detail hero). */
  showTitle?: boolean;
}

export default function Poster({ title, year, kind, showTitle = true }: PosterProps) {
  const { omdbApiKey } = useAppState();
  const { url, status } = usePoster(title, year, omdbApiKey);

  if (url) {
    return <img className="poster-img" src={url} alt={`Póster de ${title}`} />;
  }

  return (
    <div className={"poster-fallback" + (kind === "Película" ? " poster-fallback--film" : " poster-fallback--series")}>
      {status === "loading" && <div className="poster-fallback-shimmer" />}
      {showTitle && <span className="poster-fallback-title">{title}</span>}
    </div>
  );
}
