import type { Physiotherapist } from "./physiotherapists";
import type { Profile } from "./profile";

/* ------------------------------------------------------------------ */
/* Formatos de data/hora usados na interface                           */
/* ------------------------------------------------------------------ */

/** Data visual no formato D.M.A com zeros à esquerda. Ex.: "13.10.2026" */
export type DateDMY = string;

/** Horário visual 24h. Ex.: "10:00" */
export type TimeHM = string;

/* ------------------------------------------------------------------ */
/* Enums espelhando o schema.prisma                                    */
/* ------------------------------------------------------------------ */

export type UserRole = "PATIENT" | "PHYSIOTHERAPIST";

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CancellationActor = "PATIENT" | "PHYSIOTHERAPIST";

/* ------------------------------------------------------------------ */
/* Contratos da API (datas chegam como ISO 8601)                       */
/* ------------------------------------------------------------------ */

export type AppointmentBase = {
  id: number;
  patientId: number;
  physiotherapistId: number;
  scheduleId: number;
  status: AppointmentStatus;
  reason: string | null;
  price: number;
  painLevel: number | null;
  sessionNotes: string | null;
  cancelledBy: CancellationActor | null;
  cancelReason: string | null;
  rescheduledFromId: number | null;
  createdAt: string;
};

/** Consulta aninhada em GET /schedules/me */
export type ScheduleAppointment = AppointmentBase & {
  patient: Profile;
};

/** Horário de GET /schedules/me e GET /schedules?physiotherapistId= */
export type Schedule = {
  id: number;
  physiotherapistId: number;
  dateTime: string;
  available: boolean;
  /** Só vem em /schedules/me. Pode conter consultas CANCELLED antigas. */
  appointment?: ScheduleAppointment[];
};

/** Consulta de GET /appointments/me e POST /appointments */
export type Appointment = AppointmentBase & {
  schedule: Schedule;
  patient: Profile;
  physiotherapist: Physiotherapist;
};

/* ------------------------------------------------------------------ */
/* Payloads de entrada                                                 */
/* ------------------------------------------------------------------ */

export type CreateScheduleInput = {
  /** ISO 8601. Ex.: "2026-10-13T13:00:00.000Z" */
  dateTime: string;
};

export type CreateAppointmentInput = {
  scheduleId: number;
  reason?: string;
  /** 0 a 10 */
  painLevel?: number;
};

export type CancelAppointmentInput = {
  cancelReason: string;
};

/* ------------------------------------------------------------------ */
/* View models da agenda                                               */
/* ------------------------------------------------------------------ */

export type SlotState =
  | "AVAILABLE"
  | "SCHEDULED"
  | "COMPLETED"
  | "NO_SHOW"
  | "UNAVAILABLE";

export type AgendaSlot = {
  scheduleId: number;
  dateTime: string;
  date: DateDMY;
  time: TimeHM;
  state: SlotState;
  appointmentId: number | null;
  patientName: string | null;
};
