import { NextRequest, NextResponse } from "next/server";
import { buscarTitulos } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
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
