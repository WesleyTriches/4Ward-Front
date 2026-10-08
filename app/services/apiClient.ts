import { clearToken, getToken } from "../login/auth_service";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    // ValidationPipe do Nest devolve string[]
    if (Array.isArray(message)) return message.join(" · ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * fetch autenticado com JWT Bearer.
 * - 401: limpa o token e envia o usuário para /login.
 * - !ok: lança ApiError com a mensagem do Nest.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.replace("/login");
    throw new ApiError(401, extractMessage(body, "Sessão expirada."));
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(body, `Erro ${response.status} ao chamar a API.`),
    );
  }

  return body as T;
}
