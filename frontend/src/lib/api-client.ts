const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  body?: any;
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
  
  // Handle 401 Unauthorized (Expired or invalid token)
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Also clear cookies to prevent proxy redirect loops
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "userType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=true";
      }
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    const errorMsg = data?.detail?.message || data?.message || "Request failed";
    throw new Error(errorMsg);
  }

  return data as T;
}
