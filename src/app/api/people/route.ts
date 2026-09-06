import { NextRequest, NextResponse } from "next/server";
import { addPersona, getSchema } from "@/lib/sheets";

export async function GET() {
  try {
    const schema = await getSchema();
    return NextResponse.json({ personas: schema.personas.map((p) => p.nombre) });
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
    if (!body.nombre || typeof body.nombre !== "string") {
      return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
    }
    await addPersona(body.nombre);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
