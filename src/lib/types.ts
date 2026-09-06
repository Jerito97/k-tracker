export type Estado = "Pendiente" | "Mirando" | "Visto";

export const ESTADOS: Estado[] = ["Pendiente", "Mirando", "Visto"];

export type Tipo = "Serie" | "Película";

export interface PersonaEstado {
  estado: Estado | "";
  nota: number | null;
}

export interface Titulo {
  /** Fila real en la sheet (1-indexed, incluye header rows). Se usa para escrituras. */
  row: number;
  titulo: string;
  tipo: Tipo | "";
  resumen: string;
  notaCritica: number | null;
  promedio: number | null;
  personas: Record<string, PersonaEstado>;
  poster?: string;
}

export interface Persona {
  nombre: string;
  /** Columna (1-indexed) de "Estado" para esta persona */
  colEstado: number;
  /** Columna (1-indexed) de "Nota" para esta persona */
  colNota: number;
}

export interface SheetSchema {
  personas: Persona[];
  colTitulo: number;
  colTipo: number;
  colResumen: number;
  colNotaCritica: number;
  colPromedio: number | null;
  /** Cuántas filas de encabezado tiene la sheet (1 o 2) */
  headerRows: number;
  /** Índice de la última columna usada */
  lastCol: number;
}
