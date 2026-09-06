import { NextRequest, NextResponse } from "next/server";
import { buscarTitulos, getDetalle } from "@/lib/omdb";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    const imdbID = req.nextUrl.searchParams.get("imdbID");

    if (imdbID) {
      const detalle = await getDetalle(imdbID);
      if (!detalle) {
        return NextResponse.json({ error: "No se encontró el título." }, { status: 404 });
      }
      return NextResponse.json({ detalle });
    }

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ error: "Escribí al menos 2 caracteres." }, { status: 400 });
    }
    const resultados = await buscarTitulos(q.trim());
    return NextResponse.json({ resultados });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
