import { getAccessToken } from "./session";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
export async function apiRequest(path, options = {}) {
    const accessToken = getAccessToken();
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...options.headers,
            },
        });
    }
    catch {
        throw new Error("Nao conseguimos acessar o servico agora. Tente novamente em alguns instantes.");
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.error ?? "Nao conseguimos concluir agora.");
    }
    return body;
}
