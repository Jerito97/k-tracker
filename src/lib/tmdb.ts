export interface TmdbResultado {
  id: number;
  titulo: string;
  year: string;
  tipo: "Serie" | "Película";
  poster: string | null;
  resumen: string;
  rating: number | null;
}

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function requireApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("Falta la variable de entorno TMDB_API_KEY. Revisá el README.");
  }
  return key;
}

interface TmdbMultiItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
}

export async function buscarTitulos(query: string): Promise<TmdbResultado[]> {
  const apiKey = requireApiKey();
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&language=es-ES&include_adult=false`;
  const res = await fetch(url);
  const data = await res.json();
  const results = (data.results || []) as TmdbMultiItem[];

  return results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => {
      const titulo = r.title || r.name || "";
      const fecha = r.release_date || r.first_air_date || "";
      return {
        id: r.id,
        titulo,
        year: fecha ? fecha.slice(0, 4) : "",
        tipo: r.media_type === "tv" ? "Serie" : "Película",
        poster: r.poster_path ? IMG_BASE + r.poster_path : null,
        resumen: r.overview || "",
        rating: r.vote_count > 0 ? Math.round(r.vote_average * 10) / 10 : null,
      };
    });
}
