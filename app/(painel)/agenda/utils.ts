import type { BatchResult } from "../../types/schedule";

/** plural(2, "horário", "horários") -> "2 horários" */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Texto do aviso exibido depois de salvar um lote de horários */
export function summarize(result: BatchResult, date: string): string {
  const parts: string[] = [];

  if (result.created.length > 0) {
    parts.push(
      `${plural(result.created.length, "horário salvo", "horários salvos")} em ${date}`,
    );
  }
  if (result.skipped.length > 0) {
    parts.push(
      `${plural(result.skipped.length, "já existia", "já existiam")}`,
    );
  }

  return parts.join(" · ");
}
