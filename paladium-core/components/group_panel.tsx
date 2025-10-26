"use client"

import type { GroupType } from "@/types/group"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Check, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Checkbox } from "./ui/checkbox"

export default function GroupsPanel({ groups, checkedIds, onToggleGroup, onClearChecked, onApply }: {
    groups: GroupType[]
    checkedIds: Set<string>
    onToggleGroup: (id: string) => void
    onClearChecked: () => void
    onApply: () => void
}) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groups
        return groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [groups, searchQuery])



    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Groups</h2>
                {checkedIds.size > 0 && (
                    <Button onClick={onClearChecked} variant="ghost" size="sm">
                        Clear ({checkedIds.size})
                    </Button>
                )}
            </div>

            <div className="space-y-3 mb-4">
                <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 mb-4">
                {filteredGroups.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">No groups found</p>
                ) : (
                    filteredGroups.map((group) => (
                        <label
                            key={group.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-neutral-50 cursor-pointer"
                        >
                            <Checkbox
                                checked={checkedIds.has(group.id)}
                                onCheckedChange={() => onToggleGroup(group.id)}
                            />
                            <span className="text-sm flex-1">{group.name}</span>
                        </label>
                    ))
                )}
            </div>

            <Button
                onClick={onApply}
                className="w-full"
                disabled={checkedIds.size === 0}
            >
                <Check className="h-4 w-4 mr-2" />
                Apply to Selected
            </Button>
        </div>
    )
}