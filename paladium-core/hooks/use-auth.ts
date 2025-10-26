import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi, type User } from "@/lib/auth"

export function useAuth(requireAuth: boolean = false, requiredType?: "admin" | "annotator") {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const token = authApi.getToken()

            if (!token) {
                if (requireAuth) {
                    router.push("/login")
                }
                setLoading(false)
                return
            }

            try {
                const userData = await authApi.getMe(token)
                setUser(userData)

                if (requiredType && userData.type !== requiredType) {
                    router.push("/login")
                }
            } catch (error) {
                authApi.logout()
                if (requireAuth) {
                    router.push("/login")
                }
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [requireAuth, requiredType, router])

    // Função de logout
    const logout = () => {
        authApi.logout()
        setUser(null)
        router.push("/login")
    }

    return {
        user,
        loading,
        isAuthenticated: !!user,
        logout
    }
}