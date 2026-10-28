import { apiFetch } from "./apiClient";
import type { Profile, UpdateProfileInput } from "../types/profile";

/** GET /profiles/me — perfil pessoal do usuário logado. */
export function getMyProfile(): Promise<Profile> {
  return apiFetch<Profile>("/profiles/me");
}

/** PUT /profiles/me — atualiza nome, data de nascimento e foto. */
export function updateMyProfile(input: UpdateProfileInput): Promise<Profile> {
  return apiFetch<Profile>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
