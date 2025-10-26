import { useCallback, useState } from "react"

export default function useSelection() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggle = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next =
                new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    const clear = useCallback(() => setSelectedIds(new Set()), [])

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids))
    }, [])

    return { selectedIds, toggle, clear, selectAll }
}