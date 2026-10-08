import { apiFetch } from "./apiClient";
import type { Physiotherapist } from "../types/physiotherapists";
import type {
  Appointment,
  AppointmentStatus,
  CancelAppointmentInput,
  CreateAppointmentInput,
} from "../types/schedule";

/** POST /appointments — paciente agenda um horário. */
export function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * GET /appointments/me — consultas do usuário logado.
 * Paciente recebe as suas; fisioterapeuta recebe as dos seus atendimentos.
 */
export function getMyAppointments(
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<Appointment[]>(`/appointments/me${query}`);
}

/** PATCH /appointments/:id/cancel — paciente precisa de 24h de antecedência. */
export function cancelAppointment(
  id: number,
  input: CancelAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** GET /physiotherapists — dado auxiliar do fluxo de agendamento. */
export function getPhysiotherapists(): Promise<Physiotherapist[]> {
  return apiFetch<Physiotherapist[]>("/physiotherapists");
}
