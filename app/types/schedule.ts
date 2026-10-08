import type { Physiotherapist } from "./physiotherapists";
import type { Profile } from "./profile";


export type DateDMY = string;

export type TimeHM = string;

export type UserRole = "PATIENT" | "PHYSIOTHERAPIST";

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CancellationActor = "PATIENT" | "PHYSIOTHERAPIST";

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

export type ScheduleAppointment = AppointmentBase & {
  patient: Profile;
};

export type Schedule = {
  id: number;
  physiotherapistId: number;
  dateTime: string;
  available: boolean;
  appointment?: ScheduleAppointment[];
};

export type Appointment = AppointmentBase & {
  schedule: Schedule;
  patient: Profile;
  physiotherapist: Physiotherapist;
};

export type CreateScheduleInput = {
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