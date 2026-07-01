import { AuthRequestPayload, AuthResponse, ApiErrorResponse, DashboardStats, Note, NotePayload, NoteQueryParams } from "../types";

const getApiUrl = (path: string) => {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) return normalizedPath;
  if (base.endsWith("/api")) {
    return `${base}${normalizedPath.replace(/^\/api/, "")}`;
  }

  return `${base}${normalizedPath}`;
};

const request = async <T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> => {
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(getApiUrl(path), { ...init, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as ApiErrorResponse).error || "Request failed");
  }

  return data as T;
};

export const authApi = {
  login: (payload: AuthRequestPayload) => request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: AuthRequestPayload) => request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: (token: string) => request<{ user: Omit<User, "passwordHash"> }>("/api/auth/me", {}, token),
};

export const notesApi = {
  list: (token: string, params: NoteQueryParams = {}) => {
    const search = new URLSearchParams();
    if (params.view) search.set("view", params.view);
    if (params.q) search.set("q", params.q);
    if (params.tag) search.set("tag", params.tag);
    const query = search.toString();
    return request<Note[]>(`/api/notes${query ? `?${query}` : ""}`, {}, token);
  },
  stats: (token: string) => request<DashboardStats>("/api/notes/stats", {}, token),
  create: (token: string, payload: NotePayload) => request<Note>("/api/notes", { method: "POST", body: JSON.stringify(payload) }, token),
  update: (token: string, id: string, payload: Partial<NotePayload>) => request<Note>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  delete: (token: string, id: string) => request<{ message: string; note?: Note; id?: string }>(`/api/notes/${id}`, { method: "DELETE" }, token),
};
