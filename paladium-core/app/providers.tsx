"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi, type User } from "@/lib/auth"

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string, userType: "admin" | "annotator") => Promise<void>
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const token = authApi.getToken()
            if (token) {
                const userData = await authApi.getMe(token)
                setUser(userData)
            }
        } catch (error) {
            authApi.logout()
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email: string, password: string, userType: "admin" | "annotator") => {
        const data = await authApi.login(email, password, userType)
        localStorage.setItem("token", data.token)
        localStorage.setItem("userType", data.type)

        const userData = await authApi.getMe(data.token)
        setUser(userData)

        if (data.type === "admin") {
            router.push("/images")
        } else {
            router.push("/user")
        }
    }

    const logout = () => {
        authApi.logout()
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}