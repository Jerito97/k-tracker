import type { Titulo } from "./types";

export interface StatsPersona {
  persona: string;
  cantidadVista: number;
  cantidadMirando: number;
  cantidadPendiente: number;
  promedioNota: number | null;
  promedioCriticaDeSusVistos: number | null;
}

export interface Stats {
  totalTitulos: number;
  distribucionTipo: Record<string, number>;
  porPersona: StatsPersona[];
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export function computeStats(titulos: Titulo[], personas: string[]): Stats {
  const distribucionTipo: Record<string, number> = {};
  for (const t of titulos) {
    if (!t.tipo) continue;
    distribucionTipo[t.tipo] = (distribucionTipo[t.tipo] || 0) + 1;
  }

  const porPersona: StatsPersona[] = personas.map((persona) => {
    let cantidadVista = 0;
    let cantidadMirando = 0;
    let cantidadPendiente = 0;
    const notas: number[] = [];
    const criticasDeVistos: number[] = [];

    for (const t of titulos) {
      const info = t.personas[persona];
      const estado = info?.estado || "Pendiente";
      if (estado === "Visto") {
        cantidadVista += 1;
        if (info?.nota != null) notas.push(info.nota);
        if (t.notaCritica != null) criticasDeVistos.push(t.notaCritica);
      } else if (estado === "Mirando") {
        cantidadMirando += 1;
      } else {
        cantidadPendiente += 1;
      }
    }

    return {
      persona,
      cantidadVista,
      cantidadMirando,
      cantidadPendiente,
      promedioNota: promedio(notas),
      promedioCriticaDeSusVistos: promedio(criticasDeVistos),
    };
  });

  return { totalTitulos: titulos.length, distribucionTipo, porPersona };
}
