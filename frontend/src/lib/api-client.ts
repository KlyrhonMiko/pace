const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: any;
}

/** Typed error thrown by apiFetch — carries the backend ErrorCode string. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...customConfig } = options;

  const headers = { ...customConfig.headers } as Record<string, string>;

  // Automatically add Authorization header if token exists
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...customConfig,
  };

  if (body) {
    if (body instanceof FormData) {
      config.body = body;
    } else {
      headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(body);
    }
  }
  config.headers = headers;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Invalid response from server", "SERVER_ERROR_INTERNAL", response.status);
  }

  if (!response.ok) {
    const detail = data?.detail as Record<string, unknown> | undefined;
    const errorCode: string = (detail?.code as string) || (data?.code as string) || "UNKNOWN_ERROR";
    const errorMsg: string =
      (detail?.message as string) || (data?.message as string) || "Request failed";

    // For 401 responses, only redirect to the expired-session page when the
    // request is NOT a login attempt. Login failures (bad credentials, deactivated
    // account) should stay on the login form and show a specific message.
    if (response.status === 401 && typeof window !== "undefined") {
      const isLoginAttempt = endpoint === "/auth/login" || endpoint === "/auth/token";
      if (!isLoginAttempt) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "userType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        const isAlreadyOnHome = window.location.pathname === "/" || window.location.pathname === "";
        if (!isAlreadyOnHome) {
          // Preserve the current path so the login form can redirect back after auth
          const redirectParam = `&redirect=${encodeURIComponent(window.location.pathname)}`;
          if (errorCode === "ACCOUNT_DEACTIVATED") {
            window.location.href = `/?login=true&deactivated=true${redirectParam}`;
          } else {
            window.location.href = `/?login=true&expired=true${redirectParam}`;
          }
        }
      }
    }

    throw new ApiError(errorMsg, errorCode, response.status);
  }

  return data as T;
}
