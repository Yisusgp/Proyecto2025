import { supabase } from "@/lib/supabase";
import { RegistroUso, UserProfile } from "@/types/app";

export const fetchRegistros = async (
  user: UserProfile,
): Promise<RegistroUso[]> => {
  try {
    let query = supabase
      .from("registro_uso")
      .select(`
        id_registro,
        id_usuario,
        id_espacio,
        id_curso,
        fecha_hora_inicio,
        fecha_hora_fin,
        estado_final,
        proposito,
        observaciones,
        espacio (
          nombre,
          ubicacion,
          tipo_espacio
        ),
        usuario (
          nombre,
          apellido
        )
      `)
      .order("fecha_hora_inicio", { ascending: false });

    if (user.role !== "admin") {
      query = query.eq("id_usuario", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando registros:", error);
      return [];
    }

    return (data || []).map(
      (r: any) => ({
        ID_Registro: r.id_registro,
        ID_Usuario: r.id_usuario,
        ID_Espacio: r.id_espacio,
        ID_Curso: r.id_curso,
        Fecha_Hora_Inicio: r.fecha_hora_inicio,
        Fecha_Hora_Fin: r.fecha_hora_fin,
        Estado_Final: r.estado_final,
        Proposito: r.proposito,
        Observaciones: r.observaciones ?? null,
        Nombre_Espacio: r.espacio?.nombre ?? null,
        Ubicacion_Espacio: r.espacio?.ubicacion ?? null,
        Tipo_Espacio: r.espacio?.tipo_espacio ?? null,
        Nombre_Usuario: r.usuario
          ? `${r.usuario.nombre} ${r.usuario.apellido}`
          : null,
      }) as RegistroUso,
    );
  } catch (err) {
    console.error("Excepción inesperada:", err);
    return [];
  }
};
