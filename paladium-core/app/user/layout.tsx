import { ProtectedRoute } from "@/components/protected-route"

export default function LabelerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (

        <ProtectedRoute requiredType="annotator">
            {children}
        </ProtectedRoute>
    )
}