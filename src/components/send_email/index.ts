"use client";

interface EmailParams {
  tipo: "confirmacion" | "rechazo" | "cancelacion";
  email: string;
  nombre: string;
  nombreEspacio?: string;
  motivo?: string;
  id_registro?: number;
}

export const sendEmailNotification = async ({
  tipo,
  email,
  nombre,
  nombreEspacio,
  motivo,
  id_registro,
}: EmailParams) => {
  const templates = {
    confirmacion: {
      subject: "✅ Tu reserva ha sido confirmada",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">¡Hola ${nombre}!</h2>
          <p>Tu reserva ha sido <strong>confirmada exitosamente</strong>.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Espacio:</strong> ${nombreEspacio || "No especificado"}</p>
            <p><strong>Registro ID:</strong> ${id_registro || "N/A"}</p>
          </div>
          <p>Puedes proceder con tu uso del espacio.</p>
        </div>
      `,
    },
    rechazo: {
      subject: "❌ Tu reserva ha sido rechazada",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Hola ${nombre},</h2>
          <p>Tu reserva ha sido <strong>rechazada</strong>.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Motivo:</strong> ${motivo || "No especificado"}</p>
            <p><strong>Registro ID:</strong> ${id_registro || "N/A"}</p>
          </div>
        </div>
      `,
    },
    cancelacion: {
      subject: "⚠️ Tu reserva ha sido cancelada por emergencia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">Hola ${nombre},</h2>
          <p>Tu reserva ha sido <strong>cancelada por emergencia</strong>.</p>
          <div style="background: #ffe4e1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6347;">
            <p><strong>Motivo:</strong> ${motivo || "No especificado"}</p>
            <p><strong>Espacio:</strong> ${nombreEspacio || "No especificado"}</p>
            <p><strong>Registro ID:</strong> ${id_registro || "N/A"}</p>
          </div>
        </div>
      `,
    },
  };

  try {
    const template = templates[tipo];

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      console.error("Error enviando email:", await response.text());
      return false;
    }

    console.log("Email enviado exitosamente");
    return true;
  } catch (err) {
    console.error("Error en sendEmailNotification:", err);
    return false;
  }
};
