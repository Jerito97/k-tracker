import { google, sheets_v4 } from "googleapis";
import type { Estado, Persona, SheetSchema, Titulo } from "./types";
import { ESTADOS } from "./types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Hoja 1";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisá el README para configurar las credenciales de Google Sheets.`
    );
  }
  return value;
}

let cachedClient: sheets_v4.Sheets | null = null;

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Si se pegó con las comillas envolventes (comunes al copiar de un .env), sacarlas.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").trim();
}

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL").trim();
  const key = normalizePrivateKey(requiredEnv("GOOGLE_PRIVATE_KEY"));

  if (!key.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY no parece un PEM válido (no contiene 'BEGIN PRIVATE KEY'). Revisá que hayas pegado el valor completo del private_key del JSON del Service Account, sin comillas extra."
    );
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function getSheetId(): string {
  return requiredEnv("GOOGLE_SHEET_ID") ?? SHEET_ID;
}

/** Convierte un índice de columna 1-indexed a letra A1 (1 -> A, 27 -> AA). */
export function colToLetter(col: number): string {
  let letter = "";
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const FIXED_MATCHERS: Record<string, string[]> = {
  titulo: ["titulo"],
  tipo: ["tipo"],
  resumen: ["resumen"],
  notaCritica: ["nota critica", "nota_critica", "critica"],
  promedio: ["promedio"],
  poster: ["poster", "póster", "imagen", "portada"],
};

/**
 * Descubre dinámicamente el esquema de columnas a partir de la fila de encabezados.
 * Las personas NO están hardcodeadas: cualquier columna cuyo header contenga
 * "Estado" o "Nota" (y no matchee "Nota Crítica") se agrupa por el resto del texto
 * del header (ej: "Jero Estado" / "Jero Nota" -> persona "Jero").
 */
export function parseSchema(headerRow: string[]): SheetSchema {
  let colTitulo = -1;
  let colTipo = -1;
  let colResumen = -1;
  let colNotaCritica = -1;
  let colPromedio: number | null = null;
  let colPoster: number | null = null;

  const personBuckets = new Map<
    string,
    { displayName: string; colEstado?: number; colNota?: number }
  >();

  headerRow.forEach((rawHeader, idx) => {
    const header = (rawHeader || "").toString();
    if (!header.trim()) return;
    const col = idx + 1; // 1-indexed
    const norm = normalize(header);

    if (FIXED_MATCHERS.titulo.includes(norm)) {
      colTitulo = col;
      return;
    }
    if (FIXED_MATCHERS.tipo.includes(norm)) {
      colTipo = col;
      return;
    }
    if (FIXED_MATCHERS.resumen.includes(norm)) {
      colResumen = col;
      return;
    }
    if (FIXED_MATCHERS.notaCritica.includes(norm)) {
      colNotaCritica = col;
      return;
    }
    if (FIXED_MATCHERS.promedio.includes(norm)) {
      colPromedio = col;
      return;
    }
    if (FIXED_MATCHERS.poster.includes(norm)) {
      colPoster = col;
      return;
    }

    const isEstado = /estado/i.test(header);
    const isNota = /nota/i.test(header) && !/critica/i.test(header);

    if (isEstado || isNota) {
      const personName = header
        .replace(/estado/i, "")
        .replace(/nota/i, "")
        .replace(/[-_:|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!personName) return;
      const key = normalize(personName);
      const bucket = personBuckets.get(key) || { displayName: personName };
      if (isEstado) bucket.colEstado = col;
      else bucket.colNota = col;
      personBuckets.set(key, bucket);
    }
  });

  if (colTitulo === -1 || colTipo === -1 || colResumen === -1 || colNotaCritica === -1) {
    throw new Error(
      "No se pudieron encontrar las columnas fijas (Título, Tipo, Resumen, Nota Crítica) en la fila de encabezados de la sheet. Verificá que la primera fila tenga esos nombres."
    );
  }

  const personas: Persona[] = Array.from(personBuckets.values())
    .filter((b): b is { displayName: string; colEstado: number; colNota: number } =>
      typeof b.colEstado === "number" && typeof b.colNota === "number"
    )
    .map((b) => ({ nombre: b.displayName, colEstado: b.colEstado, colNota: b.colNota }))
    .sort((a, b) => a.colEstado - b.colEstado);

  const lastCol = Math.max(
    colTitulo,
    colTipo,
    colResumen,
    colNotaCritica,
    colPromedio || 0,
    colPoster || 0,
    ...personas.map((p) => Math.max(p.colEstado, p.colNota)),
    headerRow.length
  );

  return {
    personas,
    colTitulo,
    colTipo,
    colResumen,
    colNotaCritica,
    colPromedio,
    colPoster,
    headerRows: 1,
    lastCol,
  };
}

let schemaCache: { schema: SheetSchema; fetchedAt: number } | null = null;
const SCHEMA_TTL_MS = 60_000;

export async function getSchema(forceRefresh = false): Promise<SheetSchema> {
  if (!forceRefresh && schemaCache && Date.now() - schemaCache.fetchedAt < SCHEMA_TTL_MS) {
    return schemaCache.schema;
  }
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TAB}'!1:1`,
  });
  const headerRow = (res.data.values?.[0] as string[]) || [];
  const schema = parseSchema(headerRow);
  schemaCache = { schema, fetchedAt: Date.now() };
  return schema;
}

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function getTitulos(): Promise<Titulo[]> {
  const schema = await getSchema();
  const sheets = getClient();
  const lastColLetter = colToLetter(schema.lastCol);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TAB}'!A2:${lastColLetter}`,
  });
  const rows = res.data.values || [];

  const titulos: Titulo[] = [];
  rows.forEach((row, i) => {
    const titulo = (row[schema.colTitulo - 1] || "").toString().trim();
    if (!titulo) return; // fila vacía, se ignora

    const personas: Titulo["personas"] = {};
    for (const persona of schema.personas) {
      const estado = (row[persona.colEstado - 1] || "").toString().trim() as Estado | "";
      personas[persona.nombre] = {
        estado: ESTADOS.includes(estado as Estado) ? (estado as Estado) : estado === "" ? "" : estado,
        nota: parseNumber(row[persona.colNota - 1]),
      };
    }

    titulos.push({
      row: i + 2, // +2: fila 1 es header, arrays son 0-indexed
      titulo,
      tipo: (row[schema.colTipo - 1] || "").toString().trim() as Titulo["tipo"],
      resumen: (row[schema.colResumen - 1] || "").toString().trim(),
      notaCritica: parseNumber(row[schema.colNotaCritica - 1]),
      promedio: schema.colPromedio ? parseNumber(row[schema.colPromedio - 1]) : null,
      poster: schema.colPoster ? (row[schema.colPoster - 1] || "").toString().trim() || undefined : undefined,
      personas,
    });
  });

  return titulos;
}

export async function updateCelda(row: number, col: number, valor: string | number): Promise<void> {
  const sheets = getClient();
  const range = `'${SHEET_TAB}'!${colToLetter(col)}${row}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[valor]] },
  });
}

export async function updatePersonaCampo(
  row: number,
  personaNombre: string,
  campo: "estado" | "nota",
  valor: string | number
): Promise<void> {
  const schema = await getSchema();
  const persona = schema.personas.find((p) => p.nombre === personaNombre);
  if (!persona) {
    throw new Error(`No se encontró a "${personaNombre}" en las columnas de la sheet.`);
  }
  const col = campo === "estado" ? persona.colEstado : persona.colNota;
  await updateCelda(row, col, valor);
}

export async function updatePosterManual(row: number, url: string): Promise<void> {
  const schema = await getSchema();
  if (!schema.colPoster) {
    throw new Error('Tu sheet no tiene una columna "Poster". Agregala en la fila 1 primero.');
  }
  await updateCelda(row, schema.colPoster, url);
}

export interface NuevoTitulo {
  titulo: string;
  tipo: string;
  resumen: string;
  notaCritica: number | null;
  poster?: string;
}

export async function addTitulo(data: NuevoTitulo): Promise<void> {
  const schema = await getSchema();
  const sheets = getClient();

  const row: (string | number)[] = new Array(schema.lastCol).fill("");
  row[schema.colTitulo - 1] = data.titulo;
  row[schema.colTipo - 1] = data.tipo;
  row[schema.colResumen - 1] = data.resumen;
  if (data.notaCritica !== null && data.notaCritica !== undefined) {
    row[schema.colNotaCritica - 1] = data.notaCritica;
  }
  if (schema.colPoster && data.poster) {
    row[schema.colPoster - 1] = data.poster;
  }
  for (const persona of schema.personas) {
    row[persona.colEstado - 1] = "Pendiente";
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TAB}'!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  schemaCache = null;
}

async function getSheetNumericId(): Promise<number> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === SHEET_TAB);
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`No se encontró la pestaña "${SHEET_TAB}" en la sheet.`);
  }
  return sheet.properties.sheetId as number;
}

/**
 * Agrega una nueva persona insertando 2 columnas (Estado, Nota) justo antes de
 * la columna Promedio (o al final si no hay Promedio), sin tocar a las personas
 * existentes. Las filas ya cargadas quedan en "Pendiente" para la persona nueva.
 */
export async function addPersona(nombre: string): Promise<void> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) throw new Error("El nombre no puede estar vacío.");

  const schema = await getSchema();
  if (schema.personas.some((p) => normalize(p.nombre) === normalize(nombreLimpio))) {
    throw new Error(`"${nombreLimpio}" ya existe en la sheet.`);
  }

  const sheets = getClient();
  const sheetId = await getSheetNumericId();
  const insertAt0Indexed = schema.colPromedio ? schema.colPromedio - 1 : schema.lastCol;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: insertAt0Indexed,
              endIndex: insertAt0Indexed + 2,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  const colEstado = insertAt0Indexed + 1; // 1-indexed
  const colNota = insertAt0Indexed + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TAB}'!${colToLetter(colEstado)}1:${colToLetter(colNota)}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[`${nombreLimpio} Estado`, `${nombreLimpio} Nota`]] },
  });

  const rowCountRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `'${SHEET_TAB}'!A:A`,
  });
  const numDataRows = (rowCountRes.data.values?.length || 1) - 1;
  if (numDataRows > 0) {
    const estadoValues = new Array(numDataRows).fill(["Pendiente"]);
    await sheets.spreadsheets.values.update({
      spreadsheetId: getSheetId(),
      range: `'${SHEET_TAB}'!${colToLetter(colEstado)}2:${colToLetter(colEstado)}${numDataRows + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: estadoValues },
    });
  }

  schemaCache = null;
}
