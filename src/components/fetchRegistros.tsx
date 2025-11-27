import { supabase } from "@/lib/supabase";
import { UserProfile, RegistroUso } from "@/types/app";

export const fetchRegistros = async (
  user: UserProfile,
): Promise<RegistroUso[]> => {
  const { data, error } = await supabase
    .from("registro_uso")
    .select(
      `
      id_registro,
      id_usuario,
      id_espacio,
      id_curso,
      fecha_hora_inicio,
      fecha_hora_fin,
      estado_final,
      proposito,
      observaciones,
      espacio:id_espacio (id_espacio, nombre, tipo_espacio, ubicacion),
      usuario:id_usuario (id_usuario, nombre, apellido, correo_electronico)
    `,
    )
    .eq("id_usuario", user.id);

  if (error) {
    console.error("Error al cargar registros:", error);
    return [];
  }

  return (data || []).map((r: any): RegistroUso => ({
    ID_Registro: r.id_registro,
    ID_Usuario: r.id_usuario,
    ID_Espacio: r.id_espacio,
    ID_Curso: r.id_curso || null,
    Fecha_Hora_Inicio: r.fecha_hora_inicio,
    Fecha_Hora_Fin: r.fecha_hora_fin,
    Estado_Final: r.estado_final,
    Proposito: r.proposito,
    Observaciones: r.observaciones ?? null,
    Nombre_Espacio: r.espacio?.nombre ?? null,
    Ubicacion_Espacio: r.espacio?.ubicacion ?? null,
    Nombre_Usuario: r.usuario
      ? `${r.usuario.nombre} ${r.usuario.apellido}`
      : "",
    correo_electronico: r.usuario?.correo_electronico ?? null,
  }));
};
