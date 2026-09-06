import type { Titulo } from "./types";

export interface Recomendacion {
  titulo: Titulo;
  motivo: string;
}

const UMBRAL_BUENA_NOTA = 7;

/**
 * Recomienda títulos pendientes para una persona:
 * - Si tiene títulos vistos y calificados, prioriza el Tipo (Serie/Película) que
 *   mejor calificó en promedio, y desempata por Nota Crítica.
 * - Si no tiene calificaciones propias todavía, recomienda por Nota Crítica más alta.
 */
export function recomendar(titulos: Titulo[], persona: string, limit = 5): Recomendacion[] {
  const pendientes = titulos.filter((t) => (t.personas[persona]?.estado || "Pendiente") === "Pendiente");
  if (pendientes.length === 0) return [];

  const vistosCalificados = titulos.filter(
    (t) => t.personas[persona]?.estado === "Visto" && t.personas[persona]?.nota != null
  );

  if (vistosCalificados.length === 0) {
    return [...pendientes]
      .sort((a, b) => (b.notaCritica ?? -1) - (a.notaCritica ?? -1))
      .slice(0, limit)
      .map((titulo) => ({ titulo, motivo: "Mejor nota de la crítica entre las pendientes" }));
  }

  const sumaPorTipo = new Map<string, { suma: number; cantidad: number }>();
  for (const t of vistosCalificados) {
    if (!t.tipo) continue;
    const acc = sumaPorTipo.get(t.tipo) || { suma: 0, cantidad: 0 };
    acc.suma += t.personas[persona].nota as number;
    acc.cantidad += 1;
    sumaPorTipo.set(t.tipo, acc);
  }

  let tipoPreferido: string | null = null;
  let mejorPromedio = -Infinity;
  for (const [tipo, { suma, cantidad }] of sumaPorTipo.entries()) {
    const promedio = suma / cantidad;
    if (promedio > mejorPromedio) {
      mejorPromedio = promedio;
      tipoPreferido = tipo;
    }
  }

  const conPuntaje = pendientes.map((titulo) => {
    const bonusTipo = tipoPreferido && titulo.tipo === tipoPreferido ? 10 : 0;
    const puntaje = bonusTipo + (titulo.notaCritica ?? 0);
    return { titulo, puntaje, matcheaTipo: bonusTipo > 0 };
  });

  conPuntaje.sort((a, b) => b.puntaje - a.puntaje);

  return conPuntaje.slice(0, limit).map(({ titulo, matcheaTipo }) => ({
    titulo,
    motivo:
      matcheaTipo && tipoPreferido && mejorPromedio >= UMBRAL_BUENA_NOTA - 2
        ? `Te gustan las ${tipoPreferido === "Serie" ? "series" : "películas"} (promedio ${mejorPromedio.toFixed(1)})`
        : "Buena nota de la crítica",
  }));
}
