"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminLayout({ children }: { children: React.ReactNode }) {


    return (
        <ProtectedRoute requiredType="admin">

            <SidebarProvider>
                <AppSidebar />
                <main className="flex-1 flex flex-col min-h-screen w-full">
                    <div className="flex items-center gap-2 p-2 sm:p-4 border-b bg-background">
                        <SidebarTrigger className="lg:hidden" />
                        <div className="flex-1" />
                    </div>
                    <div className="flex-1 overflow-x-hidden">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </ProtectedRoute>
    )
}