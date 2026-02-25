const API = ""; // relative to same origin; Vite proxy forwards /auth, /resumes

type Json = unknown;

async function request<T>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: Record<string, unknown> } = {},
  retried = false
): Promise<T> {
  const { body, ...rest } = options;
  const res = await fetch(API + path, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...rest.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) {
    if (res.status === 401 && !retried && !path.startsWith("/auth/refresh") && path !== "/auth/logout") {
      try {
        await request<{ user: User }>("/auth/refresh", { method: "POST" }, true);
        return request<T>(path, options, true);
      } catch {
        // refresh failed, fall through to throw 401
      }
    }
    const err = new Error((data as { error?: string })?.error ?? "Request failed") as Error & {
      status: number;
      details?: unknown;
    };
    err.status = res.status;
    err.details = (data as { details?: unknown })?.details;
    throw err;
  }
  return data as T;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface ResumeListItem {
  id: string;
  title: string;
  slug: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  me: () => request<{ user: User }>("/auth/me"),
  register: (email: string, password: string, name?: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  refresh: () => request<{ user: User }>("/auth/refresh", { method: "POST" }),
};

export const resumesApi = {
  list: () => request<{ resumes: ResumeListItem[] }>("/resumes"),
  get: (id: string) =>
    request<{ resume: ResumeListItem & { content: import("@resume/shared").ResumeContent } }>(
      `/resumes/${id}`
    ),
  create: (title?: string, templateId?: string) =>
    request<{
      resume: ResumeListItem & { content: import("@resume/shared").ResumeContent };
    }>("/resumes", {
      method: "POST",
      body: { title, templateId },
    }),
  update: (
    id: string,
    data: { title?: string; templateId?: string; content?: object }
  ) =>
    request<{
      resume: ResumeListItem & { content: import("@resume/shared").ResumeContent };
    }>(`/resumes/${id}`, {
      method: "PATCH",
      body: data,
    }),
  delete: (id: string) =>
    request<void>(`/resumes/${id}`, { method: "DELETE" }),
};
