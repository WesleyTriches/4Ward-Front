import { apiFetch } from "./apiClient";
import type {
  CreatePhysiotherapistInput,
  Physiotherapist,
  PhysiotherapistFilters,
  UpdatePhysiotherapistInput,
} from "../types/physiotherapists";

/**
 * GET /physiotherapists — lista os fisioterapeutas.
 * Filtros vazios são ignorados; sem filtros, traz todos.
 */
export function getPhysiotherapists(
  filters: PhysiotherapistFilters = {},
): Promise<Physiotherapist[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const text = value?.trim();
    if (text) params.set(key, text);
  }

  const query = params.toString();
  return apiFetch<Physiotherapist[]>(
    `/physiotherapists${query ? `?${query}` : ""}`,
  );
}

/**
 * GET /physiotherapists/me — perfil profissional do usuário logado.
 * Lança ApiError com status 404 se ele ainda não criou o perfil.
 */
export function getMyPhysiotherapist(): Promise<Physiotherapist> {
  return apiFetch<Physiotherapist>("/physiotherapists/me");
}

/** POST /physiotherapists — cria o perfil profissional do usuário logado. */
export function createPhysiotherapist(
  input: CreatePhysiotherapistInput,
): Promise<Physiotherapist> {
  return apiFetch<Physiotherapist>("/physiotherapists", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** PUT /physiotherapists/me — edita o perfil profissional do usuário logado. */
export function updateMyPhysiotherapist(
  input: UpdatePhysiotherapistInput,
): Promise<Physiotherapist> {
  return apiFetch<Physiotherapist>("/physiotherapists/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
