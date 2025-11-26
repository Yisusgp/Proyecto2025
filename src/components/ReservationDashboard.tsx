"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LogOut,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  AlertTriangle,
  ImportIcon,
} from "lucide-react";
import { toast } from "sonner";
//Importamos los tipos reales de la base de datos
import { UserProfile, RegistroUso, EspacioMapeo, RegistroUsoStatus } from "@/types/app"; 


interface ReservationDashboardProps {
  user: UserProfile; //Usamos UserProfile
  onLogout: () => void;
  //Función asíncrona que retorna éxito/error y espera RegistroUso
  onCreateReservation: (
    reservation: Omit<RegistroUso, "Id_Registro" | "Estado_Final">,
  ) => Promise<{ success: boolean; error?: string }>;
  reservations: RegistroUso[]; //Usamos RegistroUso
  onDeleteReservation: (id: number) => void; //ID de Registro es un número
  espacios: EspacioMapeo[]; //Nuevo prop para mapeo de IDs
}

export function ReservationDashboard({
  user,
  onLogout,
  onCreateReservation,
  reservations,
  onDeleteReservation,
  espacios, // Desestructuramos el nuevo prop
}: ReservationDashboardProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [space, setSpace] = useState(""); // Este es el NOMBRE del espacio (ej. 'salon')
  const [description, setDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<
    number | null // ⬅️ Ahora usamos number para el ID de Registro
  >(null);
  
  // Función auxiliar para mapear el nombre del espacio al ID de la DB
  const getSpaceIdByName = (spaceName: string): number | null => {
    const espacio = espacios.find(e => e.Nombre.toLowerCase() === spaceName.toLowerCase());
    return espacio ? espacio.Id_Espacio : null;
  };


  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !startTime || !endTime || !space || !description.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Validación de Horario Operacional (8:00 AM a 8:00 PM)
    if (startTime < "08:00" || endTime > "20:00") {
        toast.error("Las reservas solo están permitidas entre 08:00 y 20:00.");
        return;
    }
    
    // Validación de Hora (fin debe ser posterior a inicio)
    if (endTime <= startTime) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }
    
    // Mapeo de valores de UI a DB (TIMESTAMP y ID)
    const formattedDate = date.toISOString().split("T")[0]; // Ej: "2025-11-01"
    const formattedDateTimeStart = `${formattedDate} ${startTime}:00`; // Ej: "2025-11-01 10:00:00"
    const formattedDateTimeEnd = `${formattedDate} ${endTime}:00`;

    const spaceId = getSpaceIdByName(space);
    if (spaceId === null) {
        toast.error("Tipo de espacio no válido o no encontrado.");
        return;
    }
    
    // Llamada al servidor (RPC/Trigger)
    const result = await onCreateReservation({
      Id_Usuario: user.id, // Id_Curso del perfil cargado
      Id_Espacio: spaceId,
      Id_Curso: null, // Asumimos null si no hay selector de curso
      Fecha_Hora_Inicio: formattedDateTimeStart,
      Fecha_Hora_Fin: formattedDateTimeEnd,
      Proposito: description,
      // No incluimos Estado_Final ni ID_Registro, el servidor los asigna.
    });

    if (!result.success) {
        // Captura el error del TRIGGER de Supabase
        toast.error(result.error || "Conflicto de reserva o error desconocido.");
        return;
    }
    
    toast.success(
      "Reserva enviada. Pendiente de aprobación del administrador.",
    );

    // Limpiar formulario
    setStartTime("");
    setEndTime("");
    setSpace("");
    setDescription("");
  };

  const handleDeleteClick = (id: number) => { // Recibe number
    setSelectedReservationId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedReservationId !== null) {
      // Llamada a la función de eliminación de Supabase
      onDeleteReservation(selectedReservationId); 
      toast.success("Reserva eliminada exitosamente");
      setDeleteDialogOpen(false);
      setSelectedReservationId(null);
    }
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
      case "Rechazado": // ⬅️ Usamos el valor de la DB
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        );
      case "Cancelado": // ⬅️ Usamos el valor de la DB
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div>
            <h1 className="text-gray-900 mb-1">Bienvenido {user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Reservation Form */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Seleccionar Fecha
              </CardTitle>
              <CardDescription>Elige la fecha para tu reserva</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
              />
            </CardContent>
          </Card>

          {/* Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Reserva</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReservation} className="space-y-6">
                {/* Date Display */}
                <div className="space-y-2">
                  <Label>Fecha Seleccionada</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-700">
                      {date
                        ? date.toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "No seleccionada"}
                    </p>
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="startTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Hora de Inicio (08:00 - 20:00)
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      min="08:00" 
                      max="20:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="endTime"
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Hora de Fin (08:00 - 20:00)
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      min="08:00" 
                      max="20:00"
                    />
                  </div>
                </div>

                {/* Space Selection */}
                <div className="space-y-2">
                  <Label htmlFor="space" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Tipo de Espacio
                  </Label>
                  <Select value={space} onValueChange={setSpace} required>
                    <SelectTrigger id="space">
                      <SelectValue placeholder="Selecciona un espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      {/*Mapeamos las opciones disponibles de la DB */}
                      {espacios.map((e) => (
                        <SelectItem key={e.Id_Espacio} value={e.Nombre}>
                            {e.Nombre} ({e.Tipo_Espacio})
                        </SelectItem>
                      ))}
                      {/* Si el mapeo de espacios está vacío, se podría mostrar un mensaje aquí */}
                      {espacios.length === 0 && <SelectItem value="" disabled>Cargando espacios...</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción de la Reserva</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe el propósito de tu reserva..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                  Enviar Solicitud de Reserva
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* My Reservations */}
        {reservations.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Mis Reservas</CardTitle>
              <CardDescription>
                Historial de tus solicitudes de reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reservations.map((Registro) => ( // Usamos 'registro' en lugar de 'reservation'
                  <div
                    key={Registro.ID_Registro} // ⬅️ Usamos ID_Registro
                    className="p-4 border rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-gray-900 capitalize">
                            {Registro.Nombre_Espacio || Registro.ID_Espacio}
                          </h3>
                          {getStatusBadge(Registro.Estado_Final)}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            📅{" "}
                            {new Date(Registro.Fecha_Hora_Inicio).toLocaleDateString(
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
                            🕐 {new Date(Registro.Fecha_Hora_Inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(Registro.Fecha_Hora_Fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="mt-2">
                            <strong>Propósito:</strong>{" "}
                            {Registro.Proposito}
                          </p>
                        </div>
                        {Registro.Estado_Final === "Rechazado" &&
                          Registro.Observaciones && (
                            <div className="mt-3 p-3 bg-red-50 rounded-md">
                              <p className="text-sm text-red-700">
                                <strong>Motivo de rechazo:</strong>{" "}
                                {Registro.Observaciones}
                              </p>
                            </div>
                          )}

                        {Registro.Estado_Final === "Cancelado" &&
                          Registro.Observaciones && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-700 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-orange-900 mb-1">
                                    Cancelación por Emergencia
                                  </p>
                                  <p className="text-sm text-orange-700">
                                    {Registro.Observaciones}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex items-start">
                        {Registro.Estado_Final !== "Cancelado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(Registro.ID_Registro)} // ⬅️ Pasamos ID_Registro
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {Registro.Estado_Final === "Rechazado" || Registro.Estado_Final === "Realizado"
                              ? "Eliminar"
                              : "Cancelar"}
                          </Button>
                        )}
                        {Registro.Estado_Final === "Cancelado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => handleDeleteClick(Registro.ID_Registro)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar del Historial
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>• Las reservas deben ser aprobadas por un administrador</li>
              <li>
                • Recibirás una notificación cuando tu reserva sea procesada
              </li>
              <li>• Puedes cancelar tus reservas en cualquier momento</li>
              <li>• El horario de atencion es de 8:00 AM a 8:00 PM</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará definitivamente la reserva. No podrás
              recuperarla después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
