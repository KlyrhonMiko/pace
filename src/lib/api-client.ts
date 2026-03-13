const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  body?: any;
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...customConfig } = options;
  
  const headers = {
    "Content-Type": "application/json",
    ...customConfig.headers,
  } as Record<string, string>;

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
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
