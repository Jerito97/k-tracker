# K-Tracker

App para trackear k-dramas y películas coreanas entre un grupo de amigas, usando un Google Sheet existente como fuente de verdad.

Stack: Next.js 14 (App Router) + TypeScript, pensado para Vercel (plan Hobby).

## Funcionalidades

- **Tracker** (`/tracker`): grilla de pósters de todos los títulos, filtro por estado y por tipo (Serie/Película). Tocar una card abre el detalle con las notas de cada persona y edición de Estado/Nota (slider 0-10) sincronizada con el Sheet.
- **Descubrir** (`/descubrir`): búsqueda manual por título en OMDb (agrega el título a la sheet como "Pendiente" para todas las personas) + recomendador simple que sugiere pendientes según lo que la persona actual vio y calificó bien (o por Nota Crítica si todavía no calificó nada).
- **Dashboard de stats** (`/dashboard`): cantidad vista por persona y promedio de notas, o comparación de tu nota vs. Nota Crítica, más distribución por tipo.
- **Personas configurables**: no hay usuarios/login. Se elige "quién sos" al entrar (se guarda en `localStorage`), y se puede sumar gente nueva desde la propia app — la sheet se actualiza dinámicamente, sin nombres hardcodeados en el código.

## Cómo la app lee la estructura de la sheet

La lista de personas **no está hardcodeada**. El código lee la primera fila (headers) de la sheet y arma el esquema de columnas dinámicamente (`src/lib/sheets.ts` → `parseSchema`):

- Columnas fijas (por nombre, sin importar mayúsculas/acentos): `Título`, `Tipo`, `Resumen`, `Nota Crítica`, `Promedio`.
- Columnas de persona: cualquier columna cuyo header contenga la palabra `Estado` o `Nota` se agrupa por el resto del texto. Por ejemplo `Jero Estado` + `Jero Nota` → persona "Jero". También funciona con `Jero - Estado` o `Estado Jero`.

Si tu sheet actual usa otros nombres de columna, alcanza con que la fila 1 tenga headers así (un ejemplo con 3 personas):

| Título | Tipo | Resumen | Nota Crítica | Jero Estado | Jero Nota | Flor Estado | Flor Nota | Liz Estado | Liz Nota | Promedio |
|---|---|---|---|---|---|---|---|---|---|---|

Agregar una persona nueva desde la app (botón "Soy nueva por acá" o el formulario en `/api/people`) inserta automáticamente las 2 columnas (`Nombre Estado`, `Nombre Nota`) antes de la columna `Promedio`, y completa "Pendiente" para todas las filas ya cargadas.

> **Nota sobre "Promedio":** si esa columna en tu sheet tiene una fórmula tipo `=AVERAGE(F2,H2,J2)` (celdas puntuales), al agregar una persona nueva esa fórmula existente **no** va a incluir su nota automáticamente (spreadsheets no lo hacen solas al insertar columnas puntuales referenciadas por celda). Para que sea automático, lo más simple es cambiar la fórmula a un rango que cubra todas las columnas de "Nota" posibles, ej. `=IFERROR(AVERAGE(F2:Z2),"")`, así al insertar columnas en el medio el rango se expande solo. De cualquier forma, el Dashboard de la app **no depende de esa fórmula**: calcula los promedios directamente a partir de las notas que lee de cada persona.

## Setup local

### 1. Requisitos

- Node.js 18.18+ (usamos Node 22 en desarrollo).
- Una cuenta de Google con acceso al Sheet: `1RqZYKqW3pf0gLlVUgl2AwKuy1v5om7pWrYk6y4Mr65c`.
- Una API key gratuita de [OMDb](https://www.omdbapi.com/apikey.aspx).

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el Service Account de Google (para leer/escribir el Sheet)

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/) y creá un proyecto (o usá uno existente).
2. En **APIs & Services → Library**, buscá **Google Sheets API** y habilitala.
3. En **APIs & Services → Credentials → Create Credentials → Service Account**. Ponele un nombre (ej. `k-tracker-sheets`) y creála (no hace falta asignarle roles a nivel de proyecto).
4. Entrá al Service Account creado → pestaña **Keys → Add Key → Create new key → JSON**. Se descarga un archivo `.json` — **no lo subas al repo**.
5. Del JSON descargado vas a necesitar dos campos:
   - `client_email` → va en `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
   - `private_key` → va en `GOOGLE_PRIVATE_KEY` (dejalo en una sola línea, con `\n` literales donde haya saltos de línea reales — así es como viene en el JSON, no hace falta tocarlo).
6. **Compartí el Google Sheet** con el `client_email` del Service Account (botón "Compartir" en Sheets, igual que compartir con una persona), dándole permiso de **Editor** — sin este paso la API no puede leer ni escribir.

### 4. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con:

```bash
GOOGLE_SHEET_ID=1RqZYKqW3pf0gLlVUgl2AwKuy1v5om7pWrYk6y4Mr65c
GOOGLE_SHEET_TAB=Hoja 1   # nombre exacto de la pestaña dentro del spreadsheet
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
OMDB_API_KEY=xxxxxxxx
```

### 5. Correr en local

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) — te va a pedir "¿Quién sos?" y después entrás directo al Tracker.

## Deploy en Vercel (plan gratis)

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (se detecta solo).
3. En **Settings → Environment Variables**, cargá las mismas 5 variables de `.env.local` (`GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `OMDB_API_KEY`).
   - Para `GOOGLE_PRIVATE_KEY`, pegá el valor completo con los `\n` literales tal cual — Vercel lo guarda como string, y el código (`src/lib/sheets.ts`) hace `.replace(/\\n/g, "\n")` para convertirlos en saltos de línea reales en runtime.
4. Deploy. Listo — no hace falta ninguna base de datos ni servicio adicional, todo el estado vive en el Google Sheet.

## Estructura del proyecto

```
src/
  app/
    tracker/        Grilla de títulos + filtros + overlay de detalle
    descubrir/      Búsqueda OMDb + recomendador simple
    dashboard/       Stats (vistos por persona / vs. crítica)
    api/
      titles/       GET (listar), POST (agregar título)
      titles/[row]/ PATCH (actualizar estado/nota de una persona en una fila)
      people/       GET (listar personas), POST (agregar persona)
      search/       Proxy a OMDb (búsqueda y detalle)
  lib/
    sheets.ts        Toda la integración con Google Sheets API (schema dinámico, lecturas, escrituras)
    omdb.ts          Cliente de OMDb
    stats.ts         Cálculo de estadísticas para el Dashboard
    recommend.ts     Lógica del recomendador simple
    palette.ts       Paleta de colores cíclica por persona (sin nombres hardcodeados)
    types.ts         Tipos compartidos
  context/
    PersonContext.tsx  Estado de "quién sos" (localStorage) + lista de personas
    ToastContext.tsx   Notificaciones tipo toast (confirmaciones de guardado)
  components/
    PersonGate.tsx     Selector "¿Quién sos?" / alta de persona nueva
    BottomNav.tsx       Navegación inferior (mobile-first)
    TituloCard.tsx      Card de póster en la grilla del Tracker
    TituloDetail.tsx    Overlay de detalle de un título (notas + edición)
```

## Diseño

La UI está basada en el diseño hecho en Claude Design (`K-Tracker.dc.html`): tema oscuro, tipografías Manrope (texto) + Instrument Serif itálica (títulos y números destacados), acentos coral/ámbar/rosa por persona, layout tipo "phone frame" centrado.

Dos elementos del diseño original usaban datos que la sheet no trackea, así que se reemplazaron por métricas reales en vez de inventar datos:
- "Racha" y "última actividad" (fechas) → reemplazado por conteos reales (vistos/pendientes).
- Gráfico de actividad mensual → reemplazado por el comparativo real "tu nota vs. Nota Crítica".

Los colores por persona se asignan dinámicamente por posición (`src/lib/palette.ts`), no por nombre — se mantienen estables al agregar gente nueva.

### Poster opcional

Si tu sheet tiene una columna llamada `Poster` (URL de imagen), la app la lee y la muestra en las cards y en el detalle. Si no existe esa columna, se muestra un placeholder con el título. Al agregar un título desde `/descubrir`, si la columna `Poster` existe se completa automáticamente con la imagen que trae OMDb.

## Próximos pasos posibles

- Soporte de género (OMDb trae `Genre`) para afinar el recomendador y guardarlo en una columna nueva de la sheet.
- Editar Nota Crítica manualmente desde la app.
- Borrar/editar títulos existentes desde el Tracker.
