import { apiFetch } from "./apiClient";
import type { Specialty, SpecialtyInput } from "../types/specialty";

/** GET /specialties — lista usada no cadastro profissional e na busca. */
export function getSpecialties(): Promise<Specialty[]> {
  return apiFetch<Specialty[]>("/specialties");
}

/**
 * POST /specialties — só fisioterapeuta (403 para os outros).
 * Lança ApiError 409 se o nome já existir.
 */
export function createSpecialty(input: SpecialtyInput): Promise<Specialty> {
  return apiFetch<Specialty>("/specialties", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** PUT /specialties/:id — mesmas regras do POST. */
export function updateSpecialty(
  id: number,
  input: SpecialtyInput,
): Promise<Specialty> {
  return apiFetch<Specialty>(`/specialties/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
