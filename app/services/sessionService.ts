import { getToken } from "../login/auth_service";
import type { UserRole } from "../types/schedule";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

type JwtPayload = {
  sub: number;
  email: string;
  name: string;
  role?: UserRole;
  exp?: number;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Lê usuário e perfil (role) do payload do JWT.
 * Serve apenas para decidir o que mostrar na UI: a autorização real
 * continua sendo feita pelo backend.
 * Tokens antigos sem `role` caem em PATIENT (menor privilégio).
 */
export function getSessionUser(): SessionUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as JwtPayload;

    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role === "PHYSIOTHERAPIST" ? "PHYSIOTHERAPIST" : "PATIENT",
    };
  } catch {
    return null;
  }
}
