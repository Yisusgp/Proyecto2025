import { supabase } from "@/lib/supabase";
import { RegistroUso, UserProfile } from "@/types/app";

export const fetchRegistros = async (
  user: UserProfile,
): Promise<RegistroUso[]> => {
  try {
    let query = supabase
      .from("Registro_Uso")
      .select(`
        Id_Registro,
        Id_Usuario,
        Id_Espacio,
        Id_Curso,
        Fecha_Hora_Inicio,
        Fecha_Hora_Fin,
        Estado_Final,
        Proposito,
        Observaciones,
        Espacio (
          Nombre,
          Ubicacion,
          Tipo_Espacio
        ),
        Usuario (
          Nombre,
          Apellido
        )
      `)
      .order("Fecha_Hora_Inicio", { ascending: false });

    if (user.role !== "admin") {
      query = query.eq("Id_Usuario", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando registros:", error);
      return [];
    }

    // 🛠 Normalización de datos con nombres correctos:
    return (data || []).map((r: any) => ({
      // Con nombres exactos que esperan tus componentes/types:
      ID_Registro: r.Id_Registro,
      ID_Usuario: r.Id_Usuario,
      ID_Espacio: r.Id_Espacio,
      ID_Curso: r.Id_Curso,
      Fecha_Hora_Inicio: r.Fecha_Hora_Inicio,
      Fecha_Hora_Fin: r.Fecha_Hora_Fin,
      Estado_Final: r.Estado_Final,
      Proposito: r.Proposito,
      Observaciones: r.Observaciones,

      // Relaciones — Espacio
      Nombre_Espacio: r.Espacio?.Nombre ?? null,
      Ubicacion_Espacio: r.Espacio?.Ubicacion ?? null,
      Tipo_Espacio: r.Espacio?.Tipo_Espacio ?? null,

      // Relaciones — Usuario
      Nombre_Usuario: r.Usuario
        ? `${r.Usuario.Nombre} ${r.Usuario.Apellido}`
        : null,
    }));
  } catch (err) {
    console.error("Excepción inesperada:", err);
    return [];
  }
};
