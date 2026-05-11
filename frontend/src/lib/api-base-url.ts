export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured) {
    throw new Error("Missing NEXT_PUBLIC_API_URL. Define it in your environment configuration.");
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_API_URL: ${configured}`);
  }

  if (typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    const apiHost = url.hostname;
    const loopbackHosts = new Set(["localhost", "127.0.0.1"]);

    if (loopbackHosts.has(browserHost) && loopbackHosts.has(apiHost) && apiHost !== browserHost) {
      throw new Error(
        `NEXT_PUBLIC_API_URL host (${apiHost}) does not match the current browser host (${browserHost}). ` +
        `Use the same loopback hostname in .env.local for both frontend and backend access.`
      );
    }
  }

  return url.origin;
}
