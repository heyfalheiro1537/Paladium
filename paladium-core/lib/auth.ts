const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface User {
    id: number
    email: string
    name?: string
    type: "admin" | "annotator"
}

export const authApi = {
    login: async (email: string, password: string, userType: "admin" | "annotator") => {
        const endpoint = userType === "admin"
            ? `${API_URL}/auth/admin/login`
            : `${API_URL}/auth/annotator/login`

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.detail || "Login failed")
        }

        return response.json()
    },

    register: async (
        email: string,
        password: string,
        userType: "admin" | "annotator",
        name?: string
    ) => {
        const endpoint = userType === "admin"
            ? `${API_URL}/auth/admin/register`
            : `${API_URL}/auth/annotator/register`

        const body = userType === "annotator" && name
            ? { email, password, name }
            : { email, password }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.detail || "Registration failed")
        }

        return response.json()
    },

    getMe: async (token: string): Promise<User> => {


        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error("getMe failed:", response.status, errorData)
            throw new Error(errorData.detail || "Failed to fetch user info")
        }

        return response.json()
    },

    changePassword: async (token: string, oldPassword: string, newPassword: string) => {
        const response = await fetch(`${API_URL}/auth/annotator/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.detail || "Password change failed")
        }

        return response.json()
    },

    logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("userType")
        localStorage.removeItem("currentUser")
    },

    getToken: () => {
        return localStorage.getItem("token")
    },

    isAuthenticated: () => {
        return !!localStorage.getItem("token")
    },

    getUserType: () => {
        return localStorage.getItem("userType") as "admin" | "annotator" | null
    },
}