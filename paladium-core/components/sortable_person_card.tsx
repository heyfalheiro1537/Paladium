import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "./ui/card"
import { GripVertical } from "lucide-react"
import { Person } from "@/types/person"
import { useSortable } from "@dnd-kit/sortable"

export default function SortablePersonCard({ person }: { person: Person }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: person.id,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing"
        >
            <Card className="mb-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.email}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
