"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/providers"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [userType, setUserType] = useState<"admin" | "annotator">("admin")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await login(email, password, userType)
        } catch (err: any) {
            setError(err.message || "Invalid email or password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
                    <CardDescription>Enter your credentials to access the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={userType} onValueChange={(v) => setUserType(v as "admin" | "annotator")} className="mb-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="admin">Admin</TabsTrigger>
                            <TabsTrigger value="annotator">Annotator</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={userType === "admin" ? "admin@example.com" : "annotator@example.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && <div className="text-sm text-destructive ">{error}</div>}
                        <Button type="submit" className="w-full transition  duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-white hover:text-black hover:border border-black" disabled={loading}>
                            {loading ? "Signing in..." : "Log In"}
                        </Button>

                        <Button className="w-full text-black border border-black bg-gray-200 transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 hover:bg-white hover:text-black hover:border border-black"

                            type="button"

                            onClick={() => router.push("/sign-up")}
                            disabled={loading}

                        >
                            Sign up
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}