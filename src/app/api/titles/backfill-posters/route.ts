import { NextResponse } from "next/server";
import { getSchema, getTitulos, updateCelda } from "@/lib/sheets";
import { buscarTitulos, elegirMejorMatch } from "@/lib/tmdb";

export const maxDuration = 60;

export async function POST() {
  try {
    const schema = await getSchema();
    const colPoster = schema.colPoster;
    if (!colPoster) {
      return NextResponse.json(
        {
          error:
            'Tu sheet todavía no tiene una columna "Poster". Agregala en la fila 1 (el nombre exacto) y volvé a intentar.',
        },
        { status: 400 }
      );
    }

    const titulos = await getTitulos();
    const faltantes = titulos.filter((t) => !t.poster && t.titulo);

    let actualizados = 0;
    const sinCoincidencia: string[] = [];

    for (const t of faltantes) {
      // language="en-US": el sheet tiene los títulos en su nombre internacional/inglés,
      // buscar en español podía traducir el título correcto y dejarlo afuera del
      // match exacto, quedándose solo con una adaptación homónima de otro país.
      const resultados = await buscarTitulos(t.titulo, "en-US");
      const match = elegirMejorMatch(resultados, t.titulo, t.tipo);
      if (match?.poster) {
        await updateCelda(t.row, colPoster, match.poster);
        actualizados++;
      } else {
        sinCoincidencia.push(t.titulo);
      }
    }

    return NextResponse.json({ actualizados, totalSinPoster: faltantes.length, sinCoincidencia });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
