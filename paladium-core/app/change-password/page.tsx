"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Lock } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export default function ChangePasswordPage() {
    const router = useRouter()
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match")
            setLoading(false)
            return
        }

        // Validate password length
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters")
            setLoading(false)
            return
        }

        // Validate new password is different from old
        if (oldPassword === newPassword) {
            setError("New password must be different from current password")
            setLoading(false)
            return
        }

        try {
            const token = localStorage.getItem("token")
            if (!token) {
                throw new Error("Not authenticated")
            }

            const response = await fetch(`${API_BASE_URL}/auth/annotator/change-password`, {
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

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || "Failed to change password")
            }

            setSuccess(true)

            // Redirect after success
            setTimeout(() => {
                router.push("/user")
            }, 2000)
        } catch (err: any) {
            setError(err.message || "Failed to change password. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                    </div>
                    <CardDescription>
                        {success
                            ? "Password changed successfully"
                            : "Update your account password"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4">
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Your password has been changed successfully!
                                </AlertDescription>
                            </Alert>
                            <p className="text-sm text-muted-foreground text-center">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword">Current Password</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    minLength={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 8 characters long
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="text-center">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Changing password..." : "Change Password"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                    className="text-sm mt-2 w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}