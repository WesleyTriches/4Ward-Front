import type { DateDMY, TimeHM } from "../types/schedule";

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const WEEKDAYS_LONG = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** Date -> "13.10.2026" */
export function formatDMY(date: Date): DateDMY {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** "13.10.2026" -> Date (meia-noite, horário local) */
export function parseDMY(value: DateDMY): Date {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
}

/** Date -> "2026-10-13" (horário local). Útil como chave e como query `date`. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO -> "10:00" (horário local) */
export function formatTime(iso: string): TimeHM {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Combina "13.10.2026" + "10:00" (local) em ISO UTC para enviar à API. */
export function combineDMYAndTime(date: DateDMY, time: TimeHM): string {
  const [hours, minutes] = time.split(":").map(Number);
  const base = parseDMY(date);
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

/** Segunda-feira da semana de `date` */
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return startOfDay(addDays(date, -offset));
}

/** Segunda a domingo */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Terça-feira, 13 de outubro" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** "Outubro 2026" */
export function formatMonthYear(date: Date): string {
  const month = MONTHS[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

/* ------------------------------------------------------------------ */
/* Intervalos de horário                                               */
/* ------------------------------------------------------------------ */

/** "08:30" -> 510 */
export function timeToMinutes(time: TimeHM): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 510 -> "08:30" */
export function minutesToTime(total: number): TimeHM {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Horários de `start` até `end` (inclusive), de `stepMinutes` em `stepMinutes`.
 * Sem `end`, devolve só o `start`. Se o intervalo for inválido, devolve [].
 */
export function buildTimeRange(
  start: TimeHM,
  end: TimeHM | "",
  stepMinutes: number,
): TimeHM[] {
  if (!start) return [];
  if (!end) return [start];

  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  if (to < from || stepMinutes <= 0) return [];

  const result: TimeHM[] = [];
  for (let current = from; current <= to; current += stepMinutes) {
    result.push(minutesToTime(current));
  }
  return result;
}
