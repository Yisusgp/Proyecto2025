/**
 * Este archivo contiene las interfaces TypeScript que mapean la estructura
 * de las tablas de PostgreSQL (USUARIO, REGISTRO_USO, ESPACIO) a los objetos
 * de datos que se usan en la aplicación React.
 */

// ----------------------------------------------------------------------
// 1. Tipos de Estado (Uniones de String)
// ----------------------------------------------------------------------

/**
 * Define los posibles roles de usuario basados en las tablas de especialización:
 * ADMINISTRADOR, PROFESOR, ESTUDIANTE, más 'guest' para usuarios autenticados sin rol especializado.
 */
export type UserRole = "admin" | "profesor" | "estudiante" | "guest";

/**
 * Define los posibles estados finales del registro de uso (REGISTRO_USO).
 * Debe coincidir con el CHECK constraint en tu tabla SQL.
 */
export type RegistroUsoStatus =
  | "Confirmado"
  | "Realizado"
  | "Cancelado"
  | "No_Show"
  | "Pendiente"
  | "Rechazado";

// ----------------------------------------------------------------------
// 2. Interfaces de Datos
// ----------------------------------------------------------------------

/**
 * Representa el perfil de usuario cargado y autenticado para el front-end.
 * Combina datos de 'USUARIO' y el rol de las tablas especializadas.
 */
export interface UserProfile {
  id: number; // ID_Usuario (INT) de la tabla USUARIO
  authId: string; // UUID de auth.users (usado para vincular)
  name: string; // Nombre y Apellido concatenados
  email: string; // Correo_Electronico
  role: UserRole; // Rol unificado
}

/**
 * Representa un registro de uso (Reserva). Mapea a la tabla REGISTRO_USO.
 * Los campos se nombran con PascalCase para facilitar su uso en JavaScript,
 * aunque los datos de la DB usen snake_case/PascalCase en SQL.
 */
export interface RegistroUso {
  correo_electronico: string;
  Nombre_Usuario: string;
  ID_Registro: number;
  ID_Usuario: number;
  ID_Espacio: number;
  ID_Curso: number | null; // Permite NULL
  Fecha_Hora_Inicio: string; // Representado como TIMESTAMP string
  Fecha_Hora_Fin: string; // Representado como TIMESTAMP string
  Estado_Final: RegistroUsoStatus;
  Proposito: string;

  // Campos opcionales para motivos de gestión
  Observaciones?: string | null;

  // Campos obtenidos mediante JOIN de la tabla ESPACIO (para mostrar en el dashboard)
  Nombre_Espacio?: string;
  Ubicacion_Espacio?: string;
}

/**
 * Representa la información esencial de un espacio. Mapea a la tabla ESPACIO.
 * Se usa principalmente para mapear el nombre del formulario al ID_Espacio de la DB.
 */
export interface EspacioMapeo {
  Id_Espacio: number;
  Nombre: string; // Nombre del espacio (ej: 'Laboratorio 101')
  Tipo_Espacio: string; // Tipo_Espacio (ej: 'Laboratorio', 'Aula')
}
