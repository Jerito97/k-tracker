export interface OmdbResultado {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string; // movie | series
  Poster: string;
}

export interface OmdbDetalle extends OmdbResultado {
  Plot: string;
  Genre: string;
  imdbRating: string;
  Runtime: string;
  Country: string;
}

function requireApiKey(): string {
  const key = process.env.OMDB_API_KEY;
  if (!key) {
    throw new Error("Falta la variable de entorno OMDB_API_KEY. Revisá el README.");
  }
  return key;
}

export async function buscarTitulos(query: string): Promise<OmdbResultado[]> {
  const apiKey = requireApiKey();
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=&r=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.Response === "False") return [];
  return (data.Search || []) as OmdbResultado[];
}

export async function getDetalle(imdbID: string): Promise<OmdbDetalle | null> {
  const apiKey = requireApiKey();
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbID)}&plot=full&r=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.Response === "False") return null;
  return data as OmdbDetalle;
}

/** Mapea el "Type" de OMDb (movie/series) al Tipo usado en la sheet. */
export function mapTipo(omdbType: string): "Serie" | "Película" {
  return omdbType === "series" ? "Serie" : "Película";
}
