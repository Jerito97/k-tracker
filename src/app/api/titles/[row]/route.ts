import { NextRequest, NextResponse } from "next/server";
import { updatePersonaCampo } from "@/lib/sheets";

export async function PATCH(req: NextRequest, { params }: { params: { row: string } }) {
  try {
    const row = parseInt(params.row, 10);
    if (!Number.isFinite(row)) {
      return NextResponse.json({ error: "Fila inválida." }, { status: 400 });
    }
    const body = await req.json();
    const { persona, campo, valor } = body as {
      persona: string;
      campo: "estado" | "nota";
      valor: string | number;
    };
    if (!persona || (campo !== "estado" && campo !== "nota")) {
      return NextResponse.json({ error: "Faltan parámetros (persona, campo)." }, { status: 400 });
    }
    await updatePersonaCampo(row, persona, campo, valor);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
