const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// The csrf_token cookie lives on the API's own origin - when the web app is on a different site
// (e.g. separate onrender.com subdomains), its JS can never read that cookie via document.cookie.
// So the API also echoes the token in the JSON body of /auth/login, /auth/refresh and /auth/me;
// we cache it here and send it back as the x-csrf-token header on state-changing requests.
let csrfTokenMemory: string | undefined;

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  isForm?: boolean;
  skipRefresh?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, isForm, skipRefresh, headers, ...rest } = options;
  const method = (options.method || "GET").toUpperCase();

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  if (!isForm && body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = csrfTokenMemory || readCookie("csrf_token");
    if (csrf) finalHeaders["x-csrf-token"] = csrf;
  }

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...rest,
      method,
      credentials: "include",
      headers: finalHeaders,
      body: body === undefined ? undefined : isForm ? (body as BodyInit) : JSON.stringify(body),
    });

  let res = await doFetch();

  if (res.status === 401 && !skipRefresh && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch();
  }

  if (!res.ok) {
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      payload = { message: res.statusText };
    }
    const message = (payload as { message?: string | string[] })?.message;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(" ") : message || "Request failed", payload);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    if (json && typeof json === "object" && typeof (json as { csrfToken?: unknown }).csrfToken === "string") {
      csrfTokenMemory = (json as { csrfToken: string }).csrfToken;
    }
    return json as T;
  }
  return (await res.blob()) as unknown as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

const SERVER_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Publicly served static assets (company logo, etc) live at the server root, not under /api. */
export function uploadUrl(path: string): string {
  return `${SERVER_ORIGIN}${path}`;
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
