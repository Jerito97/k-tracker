import { NextRequest, NextResponse } from "next/server";
import { addTitulo, getTitulos } from "@/lib/sheets";

export async function GET() {
  try {
    const titulos = await getTitulos();
    return NextResponse.json({ titulos });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.titulo) {
      return NextResponse.json({ error: "Falta el título." }, { status: 400 });
    }
    await addTitulo({
      titulo: body.titulo,
      tipo: body.tipo || "",
      resumen: body.resumen || "",
      notaCritica: body.notaCritica ?? null,
      poster: body.poster,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
