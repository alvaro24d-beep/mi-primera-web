import { Resend } from "resend";
import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function confirmationEmailHtml(nombre: string) {
  const firstName = nombre.split(" ")[0];
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#050810;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050810;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0c1220;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px 0;">
                <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Nexora<span style="color:#A8F04A;">.</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px 0;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#A8F04A;">Mensaje recibido</p>
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#ffffff;font-weight:700;letter-spacing:-0.02em;">
                  Gracias, ${firstName}.
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#FF9D7D;">
                  Hemos recibido tu mensaje correctamente. Nuestro equipo lo está revisando y te contactaremos
                  <strong style="color:#ffffff;">en menos de 24 horas</strong> al correo desde el que nos escribiste.
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#FF9D7D;">
                  Mientras tanto, no tienes que hacer nada más. Si quieres añadir algún detalle a tu proyecto,
                  simplemente responde a este email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
                  <tr>
                    <td style="padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px 14px 0 0;border-bottom:none;">
                      <span style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Respuesta</span><br/>
                      <span style="font-size:14px;color:#ffffff;">En menos de 24h</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-top:none;border-bottom:none;">
                      <span style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Compromiso</span><br/>
                      <span style="font-size:14px;color:#ffffff;">Sin coste ni compromiso</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:0 0 14px 14px;border-top:none;">
                      <span style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Propuesta</span><br/>
                      <span style="font-size:14px;color:#ffffff;">Presupuesto detallado en 48h</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                  Nexora — Agencia de software &amp; inteligencia artificial.<br/>
                  Este email es una confirmación automática de tu solicitud de contacto.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

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

  // Best-effort: the visitor's confirmation email must never fail the
  // request — their message already reached us via the notification above.
  // Note: while sending from the shared `onboarding@resend.dev` (no verified
  // custom domain), Resend only delivers to the account's own address, so
  // this will silently fail to reach real visitors until a domain is
  // verified — see CLAUDE.md / conversation notes.
  resend.emails
    .send({
      from,
      to: email,
      subject: "Hemos recibido tu mensaje — Nexora",
      html: confirmationEmailHtml(nombre),
    })
    .catch((err) => {
      console.error("No se pudo enviar el email de confirmación al visitante:", err);
    });

  return NextResponse.json({ success: true });
}
