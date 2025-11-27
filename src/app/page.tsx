"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { ReservationDashboard } from "@/components/ReservationDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  UserProfile,
  RegistroUso,
  EspacioMapeo,
  RegistroUsoStatus,
} from "@/types/app";
import { fetchRegistros } from "@/components/fetchRegistros";
import { sendEmailNotification } from "@/components/send_email";

// Perfil + rol
const fetchProfileAndRole = async (
  authUserId: string,
): Promise<UserProfile | null> => {
  const { data: userData, error: userError } = await supabase
    .from("usuario")
    .select("id_usuario, nombre, apellido, correo_electronico")
    .eq("auth_uuid", authUserId)
    .single();

  if (userError || !userData) {
    console.error(
      "Error al cargar USUARIO:",
      JSON.stringify(userError, null, 2),
    );
    return null;
  }

  let role: UserProfile["role"] = "guest";

  const checks = [
    { table: "administrador", role: "admin" as const },
    { table: "profesor", role: "profesor" as const },
    { table: "estudiante", role: "estudiante" as const },
  ];

  for (const check of checks) {
    const { count } = await supabase
      .from(check.table)
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", userData.id_usuario);

    if (count && count > 0) {
      role = check.role;
      break;
    }
  }

  return {
    id: userData.id_usuario,
    authId: authUserId,
    name: `${userData.nombre} ${userData.apellido}`,
    email: userData.correo_electronico,
    role,
  };
};

// Espacios
const fetchEspacios = async (): Promise<EspacioMapeo[]> => {
  const { data, error } = await supabase
    .from("espacio")
    .select("id_espacio, nombre, tipo_espacio");

  if (error) {
    console.error("Error al cargar espacios:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    Id_Espacio: item.id_espacio,
    Nombre: item.nombre,
    Tipo_Espacio: item.tipo_espacio,
  }));
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [registros, setRegistros] = useState<RegistroUso[]>([]);
  const [espacios, setEspacios] = useState<EspacioMapeo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApp = async () => {
      setLoading(true);

      const loadedEspacios = await fetchEspacios();
      setEspacios(loadedEspacios);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const profile = await fetchProfileAndRole(session.user.id);
        if (profile && profile.role !== "guest") {
          setUser(profile);
          const loadedRegistros = await fetchRegistros(profile);
          setRegistros(loadedRegistros);
        } else {
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    loadApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          loadApp();
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Error al cerrar sesión: ${error.message}`);
    } else {
      setUser(null);
      setRegistros([]);
      toast.info("Sesión cerrada correctamente.");
    }
  };

  const handleCreateReservation = async (
    reservationData: Omit<RegistroUso, "Estado_Final" | "ID_Registro">,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.rpc("check_and_create_registro", {
        p_id_usuario: reservationData.ID_Usuario,
        p_id_espacio: reservationData.ID_Espacio,
        p_id_curso: reservationData.ID_Curso,
        p_fecha_hora_inicio: reservationData.Fecha_Hora_Inicio,
        p_fecha_hora_fin: reservationData.Fecha_Hora_Fin,
        p_proposito: reservationData.Proposito,
      });

      if (error) {
        console.error("Error en RPC:", error);
        return { success: false, error: error.message };
      }

      if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
      }

      return { success: true };
    } catch (err) {
      console.error("Excepción en handleCreateReservation:", err);
      return {
        success: false,
        error: "Error desconocido al crear la reserva",
      };
    }
  };

  const handleApproveReservation = async (idRegistro: number) => {
    try {
      const registro = registros.find((r) => r.ID_Registro === idRegistro);

      const { error } = await supabase
        .from("registro_uso")
        .update({ estado_final: "Confirmado" })
        .eq("id_registro", idRegistro);

      if (error) {
        toast.error(`Error al aprobar: ${error.message}`);
        return;
      }

      if (user && registro) {
        // Enviar email de confirmación
        await sendEmailNotification({
          tipo: "confirmacion",
          email: registro.correo_electronico || user.email,
          nombre: registro.Nombre_Usuario || "Usuario",
          nombreEspacio: registro.Nombre_Espacio,
          id_registro: registro.ID_Registro,
        });

        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Confirmada exitosamente.");
      }
    } catch (err) {
      console.error("Error en handleApproveReservation:", err);
      toast.error("Error desconocido al aprobar.");
    }
  };

  const handleRejectReservation = async (
    idRegistro: number,
    reason: string,
  ) => {
    try {
      const registro = registros.find((r) => r.ID_Registro === idRegistro);

      const { error } = await supabase
        .from("registro_uso")
        .update({
          estado_final: "Rechazado",
          observaciones: reason,
        })
        .eq("id_registro", idRegistro);

      if (error) {
        toast.error(`Error al rechazar: ${error.message}`);
        return;
      }

      if (user && registro) {
        // Enviar email de rechazo
        await sendEmailNotification({
          tipo: "rechazo",
          email: registro.correo_electronico || user.email,
          nombre: registro.Nombre_Usuario || "Usuario",
          nombreEspacio: registro.Nombre_Espacio,
          motivo: reason,
          id_registro: registro.ID_Registro,
        });

        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Rechazada exitosamente.");
      }
    } catch (err) {
      console.error("Error en handleRejectReservation:", err);
      toast.error("Error desconocido al rechazar.");
    }
  };

  const handleDeleteReservation = async (idRegistro: number) => {
    try {
      const registro = registros.find((r) => r.ID_Registro === idRegistro);

      const { error } = await supabase
        .from("registro_uso")
        .update({
          estado_final: "Cancelado",
          observaciones: "Cancelación por emergencia",
        })
        .eq("id_registro", idRegistro);

      if (error) {
        toast.error(`Error al cancelar: ${error.message}`);
        return;
      }

      if (user && registro) {
        // Enviar email de cancelación
        await sendEmailNotification({
          tipo: "cancelacion",
          email: registro.correo_electronico || user.email,
          nombre: registro.Nombre_Usuario || "Usuario",
          nombreEspacio: registro.Nombre_Espacio,
          motivo: "Cancelación por emergencia",
          id_registro: registro.ID_Registro,
        });

        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Registro cancelado exitosamente.");
      }
    } catch (err) {
      console.error("Error en handleDeleteReservation:", err);
      toast.error("Error desconocido al cancelar.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-indigo-600">
          Cargando aplicación y sesión...
        </p>
      </div>
    );
  }

  const userRegistros = user
    ? registros.filter((r) => r.ID_Usuario === user.id)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!user ? (
        <LoginForm />
      ) : user.role === "admin" ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          reservations={registros}
          onApprove={handleApproveReservation}
          onReject={handleRejectReservation}
          onCancel={handleDeleteReservation}
        />
      ) : (
        <ReservationDashboard
          user={user}
          onLogout={handleLogout}
          onCreateReservation={handleCreateReservation}
          reservations={userRegistros}
          onDeleteReservation={handleDeleteReservation}
          espacios={espacios}
        />
      )}
      <Toaster />
    </div>
  );
}
