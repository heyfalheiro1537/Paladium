"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredType?: "admin" | "annotator"
}

export function ProtectedRoute({ children, requiredType }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (requiredType && user.type !== requiredType) {
                router.push("/login")
            }
        }
    }, [user, loading, requiredType, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user || (requiredType && user.type !== requiredType)) {
        return null
    }

    return <>{children}</>
}