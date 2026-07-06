import { Resend } from "resend";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const nombre = String(body.nombre ?? "").trim();
  const email = String(body.email ?? "").trim();
  const negocio = String(body.negocio ?? "").trim();
  const servicio = String(body.servicio ?? "").trim();
  const budget = String(body.budget ?? "").trim();
  const mensaje = String(body.mensaje ?? "").trim();

  if (!nombre || !mensaje || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!to) {
    return NextResponse.json({ success: false, error: "Falta configurar CONTACT_TO_EMAIL" }, { status: 500 });
  }

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Nuevo contacto — ${nombre}`,
    text: `Nombre: ${nombre}\nEmail: ${email}\n\nTipo de negocio: ${negocio}\nNecesita: ${servicio}\nPresupuesto: ${budget}\n\nProyecto:\n${mensaje}`,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
