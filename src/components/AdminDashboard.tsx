"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
// ⬅️ Importamos los tipos reales de la base de datos
import type { UserProfile, RegistroUso, RegistroUsoStatus } from "@/types/app"; 


// 1. CORRECCIÓN: Interfaz de Props con tipos de DB y IDs numéricos
interface AdminDashboardProps {
  user: UserProfile; // ⬅️ Usamos UserProfile
  onLogout: () => void;
  reservations: RegistroUso[]; // ⬅️ Usamos RegistroUso
  onApprove: (idRegistro: number) => Promise<void>; // ⬅️ ID es number
  onReject: (idRegistro: number, reason: string) => Promise<void>; // ⬅️ ID es number
  // Usamos onCancel para la cancelación de emergencia
  onCancel: (idRegistro: number, reason: string) => Promise<void>; // ⬅️ ID es number
}

export function AdminDashboard({
  user,
  onLogout,
  reservations,
  onApprove,
  onReject,
  onCancel,
}: AdminDashboardProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<number | null>( // ⬅️ ID es number
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  // Usamos los literales de estado de la DB
  const [filter, setFilter] = useState<
    "all" | RegistroUsoStatus
  >("all");

  // La función handleApprove ya no necesita userEmail ni space, solo el ID para el backend
  const handleApprove = (idRegistro: number) => {
    //Usa idRegistro (number)
    onApprove(idRegistro); 
    toast.success(
      <div className="flex items-start gap-2">
        <div>
          <p className="font-medium">Registro Confirmado exitosamente</p>
          <p className="text-sm opacity-90 mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Notificación enviada.
          </p>
        </div>
      </div>,
    );
  };

  const handleRejectClick = (idRegistro: number) => { // ⬅️ Recibe number
    setSelectedReservation(idRegistro);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (selectedReservation === null) return; 

    if (!rejectionReason.trim()) {
      toast.error("Por favor, proporciona un motivo de rechazo");
      return;
    }

    //Busca por ID_Registro
    const registro = reservations.find((r) => r.ID_Registro === selectedReservation); 
    await onReject(selectedReservation, rejectionReason);
    
    toast.success(
      <div className="flex items-start gap-2">
        <div>
          <p className="font-medium">Registro Rechazado</p>
          <p className="text-sm opacity-90 mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Registro ID: {registro?.ID_Registro} | Propósito: {registro?.Proposito}
          </p>
        </div>
      </div>,
    );

    setRejectDialogOpen(false);
    setSelectedReservation(null);
    setRejectionReason("");
  };

  const handleCancelClick = (idRegistro: number) => { //Recibe number
    setSelectedReservation(idRegistro);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (selectedReservation === null) return;

    if (!cancellationReason.trim()) {
      toast.error("Por favor, proporciona un motivo de cancelación");
      return;
    }

    //Busca por ID_Registro
    const registro = reservations.find((r) => r.ID_Registro === selectedReservation);
    await onCancel(selectedReservation, cancellationReason);
    
    toast.error(
      <div className="flex items-start gap-2">
        <div>
          <p className="font-medium">Registro Cancelado por Emergencia</p>
          <p className="text-sm opacity-90 mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Registro ID: {registro?.ID_Registro} | Motivo: {cancellationReason}
          </p>
        </div>
      </div>,
      { duration: 5000 },
    );

    setCancelDialogOpen(false);
    setSelectedReservation(null);
    setCancellationReason("");
  };

  const getStatusBadge = (status: RegistroUsoStatus) => { // ⬅️ Usamos RegistroUsoStatus
    switch (status) {
      case "Pendiente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "Confirmado":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprobada
          </Badge>
        );
      case "Rechazado":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        );
      case "Cancelado":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      case "Realizado":
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            Realizado
          </Badge>
        );
      case "No_Show":
        return (
          <Badge variant="destructive" className="bg-gray-200 text-gray-700 border-gray-400">
            No Show
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const filteredReservations = reservations.filter((r) =>
    filter === "all" ? true : r.Estado_Final === filter, // ⬅️ Filtra por Estado_Final
  );

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.Estado_Final === "Pendiente").length,
    approved: reservations.filter((r) => r.Estado_Final === "Confirmado").length,
    rejected: reservations.filter((r) => r.Estado_Final === "Rechazado").length,
    cancelled: reservations.filter((r) => r.Estado_Final === "Cancelado").length,
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h1 className="text-gray-900">Panel de Administración</h1>
            </div>
            <p className="text-gray-600">
              {user.name} - {user.email}
            </p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-gray-900 mt-1">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-yellow-600 text-sm">Pendientes</p>
                <p className="text-yellow-700 mt-1">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-green-600 text-sm">Aprobadas</p>
                <p className="text-green-700 mt-1">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 text-sm">Rechazadas</p>
                <p className="text-red-700 mt-1">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-orange-600 text-sm">Canceladas</p>
                <p className="text-orange-700 mt-1">{stats.cancelled}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Los filtros siguen usando los literales de estado de la DB */}
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todas
          </Button>
          <Button
            variant={filter === "Pendiente" ? "default" : "outline"}
            onClick={() => setFilter("Pendiente")}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === "Confirmado" ? "default" : "outline"}
            onClick={() => setFilter("Confirmado")}
          >
            Aprobadas
          </Button>
          <Button
            variant={filter === "Rechazado" ? "default" : "outline"}
            onClick={() => setFilter("Rechazado")}
          >
            Rechazadas
          </Button>
          <Button
            variant={filter === "Cancelado" ? "default" : "outline"}
            onClick={() => setFilter("Cancelado")}
          >
            Canceladas
          </Button>
        </div>

        {/* Reservations List */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Reserva</CardTitle>
            <CardDescription>
              Gestiona todas las solicitudes del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  No hay registros{" "}
                  {filter !== "all"
                    ? filter === "Pendiente"
                      ? "pendientes"
                      : filter === "Confirmado"
                        ? "aprobados"
                        : "rechazados"
                    : ""}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {filteredReservations.map((registro) => ( 
                  <div
                    key={registro.ID_Registro} 
                    className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-gray-900 capitalize">
                            {registro.Nombre_Espacio || `ID Espacio: ${registro.ID_Espacio}`}
                          </h3>
                          {getStatusBadge(registro.Estado_Final)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div>
                            <p className="mb-1">
                              👤 <strong>Usuario ID:</strong>{" "}
                              {registro.Nombre_Usuario || `Usuario ${registro.ID_Usuario}`}
                            </p>
                            <p>🗺️ {registro.Ubicacion_Espacio || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="mb-1">
                              📅 <strong>Fecha:</strong>{" "}
                              {new Date(registro.Fecha_Hora_Inicio).toLocaleDateString(
                                "es-ES",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                            <p>
                              🕐 <strong>Horario:</strong>{" "}
                              {new Date(registro.Fecha_Hora_Inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(registro.Fecha_Hora_Fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded-md">
                          <p>
                            <strong>Propósito:</strong>{" "}
                            {registro.Proposito}
                          </p>
                        </div>

                        {registro.Estado_Final === "Rechazado" &&
                          registro.Observaciones && (
                            <div className="mt-3 p-3 bg-red-50 rounded-md">
                              <p className="text-sm text-red-700">
                                <strong>Motivo de rechazo:</strong>{" "}
                                {registro.Observaciones}
                              </p>
                            </div>
                          )}

                        {registro.Estado_Final === "Cancelado" &&
                          registro.Observaciones && (
                            <div className="mt-3 p-3 bg-orange-50 rounded-md">
                              <p className="text-sm text-orange-700">
                                <strong>Motivo de cancelación:</strong>{" "}
                                {registro.Observaciones}
                              </p>
                            </div>
                          )}
                      </div>

                      {registro.Estado_Final === "Pendiente" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                            onClick={() => handleApprove(registro.ID_Registro)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                            onClick={() => handleRejectClick(registro.ID_Registro)} // ⬅️ Pasamos ID_Registro
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {registro.Estado_Final === "Confirmado" && (
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border-orange-200"
                            onClick={() => handleCancelClick(registro.ID_Registro)} // ⬅️ Pasamos ID_Registro
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Cancelar por Emergencia
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Registro</DialogTitle>
            <DialogDescription>
              Por favor, proporciona un motivo para rechazar este registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo del rechazo</Label>
              <Textarea
                id="reason"
                placeholder="Ej: El espacio ya está reservado para esa fecha y hora..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        {/* ... (Diálogo de Cancelación) ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Cancelar Registro por Emergencia
            </DialogTitle>
            <DialogDescription>
              Esta acción cancelará un registro ya confirmado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">
                Motivo de la cancelación
              </Label>
              <Textarea
                id="cancellationReason"
                placeholder="Ej: El espacio es requerido por autoridades superiores debido a una reunión urgente..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
