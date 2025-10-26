import { useSortable } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Person } from "@/types/person";
import { GroupType } from "@/types/group";

export default function DroppableGroupCard({ group, onDelete, onRemoveMember }: { group: GroupType; onDelete: () => void; onRemoveMember: (groupId: string, memberId: string) => void }) {
    const { setNodeRef, isOver } = useSortable({
        id: group.id,
    })

    return (
        <Card
            ref={setNodeRef}
            className={`shadow-xl transition-all ${isOver ? "ring-2 ring-primary border-primary" : ""
                }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs pr-2">
                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0 min-h-[100px]">
                {group.members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Drag people here</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {group.members.map((member: Person) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md hover:bg-secondary/70 transition-colors group"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveMember(group.id, member.id)}
                                    className="h-7 w-7 opacity-10 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}