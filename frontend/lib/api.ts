type ApiResult<T> =
  | {
      apiUrl: string;
      data: T;
      error: null;
      online: true;
    }
  | {
      apiUrl: string;
      data: null;
      error: string;
      online: false;
    };

export type HealthResponse = {
  status: string;
};

const API_URL = process.env.API_URL ?? "http://localhost:3001";

async function apiRequest<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        apiUrl: API_URL,
        data: null,
        error: `HTTP ${response.status}`,
        online: false,
      };
    }

    return {
      apiUrl: API_URL,
      data: (await response.json()) as T,
      error: null,
      online: true,
    };
  } catch {
    return {
      apiUrl: API_URL,
      data: null,
      error: "Backend indisponivel",
      online: false,
    };
  }
}

export function getApiHealth() {
  return apiRequest<HealthResponse>("/api/health");
}
