"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Plus, Users, Image, PenBox, UserPen, Group } from "lucide-react"
import { toast } from "sonner"
import SortablePersonCard from "@/components/sortable_person_card"
import { Person } from "@/types/person"
import { GroupType } from "@/types/group"
import DroppableGroupCard from "@/components/droppable_group_card"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;








export default function GroupCreationPage() {
    const [people, setPeople] = useState<Person[]>([])
    const [groups, setGroups] = useState<GroupType[]>([])
    const [images, setImages] = useState<ImageData[]>([])
    const [newGroupName, setNewGroupName] = useState("")
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreateAnnotatorOpen, setIsCreateAnnotatorOpen] = useState(false)
    const [newAnnotatorName, setNewAnnotatorName] = useState("")
    const [newAnnotatorEmail, setNewAnnotatorEmail] = useState("")
    const [newAnnotatorPassword, setNewAnnotatorPassword] = useState("")
    const [emailError, setEmailError] = useState<string | null>(null)


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch annotators (people)
            const annotatorsRes = await fetch(`${API_BASE_URL}/annotators/`)
            if (annotatorsRes.ok) {
                const annotatorsData = await annotatorsRes.json()
                setPeople(
                    annotatorsData.map((a: any) => ({
                        id: String(a.id),
                        name: a.name,
                        email: a.email,
                    }))
                )
            }

            // Fetch groups
            const groupsRes = await fetch(`${API_BASE_URL}/groups/`)
            if (groupsRes.ok) {
                const groupsData = await groupsRes.json()
                setGroups(
                    groupsData.map((g: any) => ({
                        id: String(g.id),
                        name: g.name,
                        members: g.members.map((m: any) => ({
                            id: String(m.id),
                            name: m.name,
                            email: m.email,
                        })),
                    }))
                )
            }

            // Fetch images
            const imagesRes = await fetch(`${API_BASE_URL}/images/`)
            if (imagesRes.ok) {
                const imagesData = await imagesRes.json()
                setImages(
                    imagesData.map((img: any) => ({
                        id: String(img.id),
                        name: img.name,
                        url: `${API_BASE_URL}${img.url}`,
                    }))
                )
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activePersonId = active.id as string
        const overGroupId = over.id as string

        // Check if person is already in a group
        const personInGroup = groups.find(g => g.members.some(m => m.id === activePersonId))
        if (personInGroup) {
            toast.error("This person is already assigned to a group")
            return
        }

        // Find the person being dragged
        const person = people.find(p => p.id === activePersonId)
        if (!person) return

        // Find the target group
        const targetGroup = groups.find(g => g.id === overGroupId)
        if (!targetGroup) return

        // Add person to group
        // Add API to update members of a group here
        setGroups(groups.map(g =>
            g.id === overGroupId
                ? { ...g, members: [...g.members, person] }
                : g
        ))
        const response = await fetch(`${API_BASE_URL}/groups/${overGroupId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                annotator_id: parseInt(activePersonId),
            }),
        })
        toast(`${person.name} added to ${targetGroup.name}`)
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Group name cannot be empty")
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/groups/?name=${encodeURIComponent(newGroupName)}`, {
                method: "POST",
            })

            if (!response.ok) throw new Error("Failed to create group")

            const data = await response.json()
            const newGroup: GroupType = {
                id: String(data.id),
                name: data.name,
                members: [],
            }

            setGroups([...groups, newGroup])
            setNewGroupName("")
            setIsCreateDialogOpen(false)
            toast(`Group "${data.name}" created`)
        } catch (error) {
            console.error("Error creating group:", error)
            toast("Failed to create group")
        }
    }
    const handleRemoveMember = async (groupId: string, memberId: string) => {
        setGroups(groups.map(g =>
            g.id === groupId
                ? { ...g, members: g.members.filter(m => m.id !== memberId) }
                : g
        ))

        const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/members/${memberId}`,
            { method: "DELETE" }
        )
    }



    const handleDeleteGroup = async (groupId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete group")
            setGroups(groups.filter(g => g.id !== groupId))
            toast.success("Group deleted")
        } catch (error) {
            console.error("Error deleting group:", error)
            toast("Failed to delete group")
        }
    }

    const handleCreateAnnotator = async () => {
        setEmailError(null)

        if (!newAnnotatorName.trim() || !newAnnotatorEmail.trim()) {
            setEmailError("Name and email are required")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newAnnotatorEmail)) {
            setEmailError("Please enter a valid email address")
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/annotators/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newAnnotatorName,
                    email: newAnnotatorEmail,
                    password: newAnnotatorPassword,
                }),
            })


            if (response.status === 409) {
                setEmailError("This email address is already registered.")
                return
            }

            if (!response.ok) {
                throw new Error("Failed to create annotator")
            }

            const data = await response.json()
            const newAnnotator: Person = {
                id: String(data.id),
                name: data.name,
                email: data.email,
            }

            setPeople([...people, newAnnotator])
            setNewAnnotatorName("")
            setNewAnnotatorEmail("")
            setIsCreateAnnotatorOpen(false)
            toast.success(`Annotator "${data.name}" created`)
        } catch (error: any) {
            console.error("Error creating annotator:", error)
            setEmailError("Failed to create annotator")
        }
    }



    const activePerson = activeId ? people.find(p => p.id === activeId) : null
    const availablePeople = people.filter(
        person => !groups.some(g => g.members.some(m => m.id === person.id))
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading groups...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="p-6">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground mb-2">Group Management</h1>
                        <p className="text-muted-foreground">
                            Drag and drop annotators into groups. Each person can only be in one group.
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <UserPen className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-2xl font-bold">{people.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Annotators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent >
                            <div className="flex items-center gap-3">
                                <Users className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{groups.length}</p>
                                    <p className="text-sm text-muted-foreground">Active Groups</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Image className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{images.length}</p>
                                    <p className="text-sm text-muted-foreground">Total Images</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <PenBox className="h-5 w-5" />
                                            Available Annotators

                                        </CardTitle>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsCreateAnnotatorOpen(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {availablePeople.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                All annotators are assigned
                                            </p>
                                        </div>
                                    ) : (
                                        <SortableContext
                                            items={availablePeople.map(p => p.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {availablePeople.map(person => (
                                                <SortablePersonCard key={person.id} person={person} />
                                            ))}
                                        </SortableContext>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">



                            <Card className={`${groups.length === 0 ? "" : " bg-grey/50"}`}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Group className="h-5 w-5" />
                                            Groups

                                        </CardTitle>
                                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="gap-2">
                                                    <Plus className="h-4 w-4" />
                                                    Create Group
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New Group</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div>
                                                        <Input
                                                            value={newGroupName}
                                                            onChange={(e) => setNewGroupName(e.target.value)}
                                                            placeholder="Enter group name..."
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleCreateGroup()
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsCreateDialogOpen(false)}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={handleCreateGroup}
                                                            className="flex-1"
                                                            disabled={!newGroupName.trim()}
                                                        >
                                                            Create
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent >
                                    {groups.length === 0 ? (<div className="text-center">
                                        <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-muted-foreground mb-4">No groups yet</p>
                                        <Button className="mb-4" onClick={() => setIsCreateDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create First Group
                                        </Button>
                                    </div>) : (<SortableContext
                                        items={groups.map(g => g.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                            {groups.map(group => (
                                                <DroppableGroupCard
                                                    key={group.id}
                                                    group={group}
                                                    onDelete={() => handleDeleteGroup(group.id)}
                                                    onRemoveMember={handleRemoveMember}

                                                />
                                            ))}
                                        </div>
                                    </SortableContext>)}
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    <DragOverlay>
                        {activePerson ? (
                            <Card className="w-64 cursor-grabbing opacity-80 shadow-lg">
                                <CardContent className="p-3">
                                    <p className="font-medium text-sm">{activePerson.name}</p>
                                    <p className="text-xs text-muted-foreground">{activePerson.email}</p>
                                </CardContent>
                            </Card>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Create Annotator Dialog */}
                <Dialog open={isCreateAnnotatorOpen} onOpenChange={setIsCreateAnnotatorOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Annotator</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Name
                                </label>
                                <Input
                                    value={newAnnotatorName}
                                    onChange={(e) => setNewAnnotatorName(e.target.value)}
                                    placeholder="Enter annotator name..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <Input
                                    type="email"
                                    value={newAnnotatorEmail}
                                    onChange={(e) => setNewAnnotatorEmail(e.target.value)}
                                    placeholder="Enter email address..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreateAnnotator()
                                    }}
                                />
                                {emailError && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{emailError}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Temporary Password
                                </label>
                                <Input
                                    type="password"
                                    value={newAnnotatorPassword}
                                    onChange={(e) => setNewAnnotatorPassword(e.target.value)}
                                    placeholder="Enter temporary password..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateAnnotatorOpen(false)
                                        setNewAnnotatorName("")
                                        setNewAnnotatorEmail("")
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateAnnotator}
                                    className="flex-1"
                                    disabled={!newAnnotatorName.trim() || !newAnnotatorEmail.trim() || !newAnnotatorPassword.trim()}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}