export interface PersonaColor {
  color: string;
  colorSoft: string;
  tint: string;
}

/**
 * Paleta cíclica para personas: no hay colores hardcodeados por nombre,
 * se asignan por posición (orden de columnas en la sheet) para que se
 * mantengan estables al agregar gente nueva.
 */
const PALETTE: PersonaColor[] = [
  { color: "#f0604a", colorSoft: "#c9432f", tint: "rgba(240,96,74,.16)" },
  { color: "#e2a44b", colorSoft: "#b07d2f", tint: "rgba(226,164,75,.16)" },
  { color: "#d6849b", colorSoft: "#a75f74", tint: "rgba(214,132,155,.16)" },
  { color: "#9184d9", colorSoft: "#5d5294", tint: "rgba(145,132,217,.16)" },
  { color: "#6bb0a8", colorSoft: "#3f7d76", tint: "rgba(107,176,168,.16)" },
  { color: "#c9a24b", colorSoft: "#96762f", tint: "rgba(201,162,75,.16)" },
];

export function colorFor(index: number): PersonaColor {
  return PALETTE[index % PALETTE.length];
}

export function initialFor(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}
