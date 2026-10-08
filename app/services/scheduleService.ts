import { apiFetch } from "./apiClient";
import { formatDMY, formatTime } from "../lib/date";
import type {
  AgendaSlot,
  CreateScheduleInput,
  Schedule,
  ScheduleAppointment,
  SlotState,
} from "../types/schedule";

/**
 * GET /schedules/me — agenda do fisioterapeuta logado (JWT).
 * Sem `date`, devolve todos os horários; o agrupamento por dia é feito no
 * cliente para respeitar o fuso do navegador. `date` ("YYYY-MM-DD") é opcional.
 */
export function getMySchedules(date?: string): Promise<Schedule[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiFetch<Schedule[]>(`/schedules/me${query}`);
}

/**
 * GET /schedules?physiotherapistId= — horários livres de um fisioterapeuta
 * (usado pelo paciente no fluxo de agendamento).
 */
export function getAvailableSchedules(
  physiotherapistId: number,
  date?: string,
): Promise<Schedule[]> {
  const params = new URLSearchParams({
    physiotherapistId: String(physiotherapistId),
  });
  if (date) params.set("date", date);
  return apiFetch<Schedule[]>(`/schedules?${params.toString()}`);
}

/** POST /schedules — fisioterapeuta publica um novo horário. */
export function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  return apiFetch<Schedule>("/schedules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ------------------------------------------------------------------ */
/* Mapeamento API -> view model                                        */
/* ------------------------------------------------------------------ */

/** Consulta que "ocupa" o horário: ignora as CANCELLED. */
function findActiveAppointment(
  schedule: Schedule,
): ScheduleAppointment | null {
  return (
    schedule.appointment?.find(
      (appointment) => appointment.status !== "CANCELLED",
    ) ?? null
  );
}

function resolveState(
  schedule: Schedule,
  active: ScheduleAppointment | null,
): SlotState {
  if (!active) return schedule.available ? "AVAILABLE" : "UNAVAILABLE";

  switch (active.status) {
    case "COMPLETED":
      return "COMPLETED";
    case "NO_SHOW":
      return "NO_SHOW";
    default:
      return "SCHEDULED";
  }
}

export function toAgendaSlot(schedule: Schedule): AgendaSlot {
  const active = findActiveAppointment(schedule);
  const date = new Date(schedule.dateTime);

  return {
    scheduleId: schedule.id,
    dateTime: schedule.dateTime,
    date: formatDMY(date),
    time: formatTime(schedule.dateTime),
    state: resolveState(schedule, active),
    appointmentId: active?.id ?? null,
    patientName: active?.patient.fullName ?? null,
  };
}
