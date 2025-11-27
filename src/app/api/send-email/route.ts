import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, subject, html } = await request.json();

    const response = await resend.emails.send({
      from: "noreply@tudominio.com",
      to: email,
      subject,
      html,
    });

    if (response.error) {
      return Response.json(
        { error: response.error.message },
        { status: 400 },
      );
    }

    return Response.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Error en API send-email:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
