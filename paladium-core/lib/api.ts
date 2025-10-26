import { authApi } from "./auth"

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = authApi.getToken()

    if (!token) {
        throw new Error("Not authenticated")
    }

    const headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
        authApi.logout()
        window.location.href = "/login"
        throw new Error("Unauthorized")
    }

    return response
}