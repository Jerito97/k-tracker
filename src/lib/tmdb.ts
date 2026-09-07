export interface TmdbResultado {
  id: number;
  titulo: string;
  year: string;
  tipo: "Serie" | "Película";
  poster: string | null;
  resumen: string;
  rating: number | null;
  idiomaOriginal: string;
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
  original_language?: string;
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
        idiomaOriginal: r.original_language || "",
      };
    });
}

function normalizarTitulo(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Elige, entre los resultados de una búsqueda, el que mejor matchea un título
 * y tipo ya conocidos (para el backfill de pósters). Solo acepta coincidencias
 * de título EXACTAS (ignorando mayúsculas/acentos/puntuación) para no pisar un
 * póster con el de una serie/película homónima de otro país; entre varias
 * coincidencias exactas, prioriza el mismo Tipo y el idioma original coreano.
 */
export function elegirMejorMatch(
  resultados: TmdbResultado[],
  tituloBuscado: string,
  tipoBuscado: string
): TmdbResultado | null {
  const norm = normalizarTitulo(tituloBuscado);
  const exactos = resultados.filter((r) => r.poster && normalizarTitulo(r.titulo) === norm);
  if (exactos.length === 0) return null;

  const puntaje = (r: TmdbResultado) =>
    (r.tipo === tipoBuscado ? 2 : 0) + (r.idiomaOriginal === "ko" ? 1 : 0);

  return exactos.slice().sort((a, b) => puntaje(b) - puntaje(a))[0];
}
