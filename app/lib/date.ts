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

export function formatDMY(date: Date): DateDMY {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function parseDMY(value: DateDMY): Date {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTime(iso: string): TimeHM {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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

export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return startOfDay(addDays(date, -offset));
}

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

export function formatLongDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatMonthYear(date: Date): string {
  const month = MONTHS[date.getMonth()];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}
