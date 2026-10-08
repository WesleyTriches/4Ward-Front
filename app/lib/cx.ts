/** Junta nomes de classe ignorando valores falsos. cx(a, cond && b) */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
