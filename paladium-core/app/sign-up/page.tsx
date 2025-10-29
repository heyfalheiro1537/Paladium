"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminRegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Validate password length
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/admin/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || "Registration failed")
            }

            // Store token
            localStorage.setItem("token", data.token)
            localStorage.setItem("userType", data.type)

            setSuccess(true)

            // Redirect after success
            setTimeout(() => {
                router.push("/images")
            }, 1500)
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Admin Registration</CardTitle>
                    <CardDescription>Create a new admin account</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4 text-center">
                            <div className="text-lg font-medium text-green-600">
                                Registration successful!
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
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
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                            </div>
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating account..." : "Register"}
                            </Button>
                            <div className="text-center">
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => router.push("/login")}
                                    disabled={loading}
                                    className="text-sm"
                                >
                                    Already have an account? Sign in
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}