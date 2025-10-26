"use client"
import { useState, useMemo, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Upload, Image, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GroupType } from "@/types/group"
import { ImageItem } from "@/types/image_group"
import useSelection from "@/hooks/use-selection"
import useGroupAssignments from "@/hooks/use-group-assignments"
import TopBar from "@/components/topbar"
import ImageCard from "@/components/image_card"
import GroupsPanel from "@/components/group_panel"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


export default function AssignmentTrayPage() {
    const [groups, setGroups] = useState<GroupType[]>([])
    const [trayChecked, setTrayChecked] = useState<Set<string>>(new Set())
    const [mobileGroupsOpen, setMobileGroupsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const { selectedIds, toggle, clear, selectAll } = useSelection()
    const { images, assignMultipleGroups, removeFromGroup, addImage, toast, setImages } = useGroupAssignments([])


    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/images/`)
                if (!response.ok) throw new Error('Failed to fetch images')

                const data = await response.json()
                const transformedImages: ImageItem[] = data.map((img: any) => ({
                    id: String(img.id),
                    url: `${API_BASE_URL}${img.url}`,
                    groupIds: img.groups.map((g: any) => String(g.id)),
                    alt: img.name
                }))

                setImages(transformedImages)
            } catch (error) {
                console.error('Error fetching images:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchImages()
    }, [setImages])

    // Fetch groups from API
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/groups/`)
                if (!response.ok) throw new Error('Failed to fetch groups')

                const data = await response.json()
                const transformedGroups: GroupType[] = data.map((group: any) => ({
                    id: String(group.id),
                    name: group.name
                }))

                setGroups(transformedGroups)
            } catch (error) {
                console.error('Error fetching groups:', error)
            }
        }

        fetchGroups()
    }, [])


    const groupNameMap = useMemo(() =>
        new Map(groups.map(g => [g.id, g.name])),
        [groups]
    )
    const getGroupName = useCallback((id: string) => groupNameMap.get(id) || id, [groupNameMap])

    const toggleTrayGroup = useCallback((gid: string) => {
        setTrayChecked((prev) => {
            const next = new Set(prev)
            next.has(gid) ? next.delete(gid) : next.add(gid)
            return next
        })
    }, [])

    const handleApplyFromTray = useCallback(async () => {
        if (selectedIds.size === 0) return

        try {
            // Add groups to selected images via API
            const promises = Array.from(selectedIds).flatMap(imageId =>
                Array.from(trayChecked).map(groupId =>
                    fetch(`${API_BASE_URL}/images/${imageId}/groups/${groupId}`, {
                        method: 'POST'
                    })
                )
            )

            await Promise.all(promises)

            // Update local state
            assignMultipleGroups(Array.from(selectedIds), Array.from(trayChecked))
            setTrayChecked(new Set())
            setMobileGroupsOpen(false)
        } catch (error) {
            console.error('Error assigning groups:', error)
        }
    }, [selectedIds, trayChecked, assignMultipleGroups])



    const handleRemoveGroup = useCallback(async (imageId: string, groupId: string) => {
        try {
            await fetch(`${API_BASE_URL}/images/${imageId}/groups/${groupId}`, {
                method: 'DELETE'
            })

            removeFromGroup([imageId], groupId)
        } catch (error) {
            console.error('Error removing group:', error)
        }
    }, [removeFromGroup])

    const handleImageUpload = useCallback(async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${API_BASE_URL}/images/upload`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) throw new Error('Upload failed')

            const data = await response.json()
            const newImage: ImageItem = {
                id: String(data.id),
                url: `${API_BASE_URL}${data.url}`,
                groupIds: [],
                alt: data.name
            }

            addImage(newImage)
        } catch (error) {
            console.error('Error uploading image:', error)
        }
    }, [addImage])

    const handleSelectAll = useCallback(() => {
        selectAll(images.map(img => img.id))
    }, [images, selectAll])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault()
                handleSelectAll()
            }
            if (e.key === 'Escape' && selectedIds.size > 0) {
                clear()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleSelectAll, selectedIds.size, clear])

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading images...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="p-4 sm:p-6">
                <TopBar
                    selectedCount={selectedIds.size}
                    totalCount={images.length}
                    onClear={clear}
                    onSelectAll={handleSelectAll}
                    onImageUpload={handleImageUpload}
                />

                {toast && (
                    <Alert className={`mb-4 ${toast.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{toast.message}</AlertDescription>
                    </Alert>
                )}

                <div className="mx-auto max-w-7xl grid grid-cols-12 gap-4 sm:gap-6">
                    <div className="col-span-12 lg:col-span-8">
                        {images.length === 0 ? (
                            <Card className="p-12">
                                <div className="text-center">
                                    <Image className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                                    <p className="text-neutral-500 mb-4">Upload some images to get started</p>
                                    <Button onClick={() => document.getElementById('file-upload')?.click()}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload First Image
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {images.map((img) => (
                                    <ImageCard
                                        key={img.id}
                                        image={img}
                                        isSelected={selectedIds.has(img.id)}
                                        onToggle={() => toggle(img.id)}
                                        onRemoveGroup={(gid) => handleRemoveGroup(img.id, gid)}
                                        getGroupName={getGroupName}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="hidden lg:block col-span-12 lg:col-span-4">
                        <div className="sticky top-6 space-y-4">
                            <GroupsPanel
                                groups={groups}
                                checkedIds={trayChecked}
                                onToggleGroup={toggleTrayGroup}
                                onClearChecked={() => setTrayChecked(new Set())}
                                onApply={handleApplyFromTray}
                            />
                        </div>
                    </aside>
                </div>

                {images.length > 0 && (
                    <Button
                        onClick={() => setMobileGroupsOpen(true)}
                        className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
                        size="icon"
                        aria-label="Open groups panel"
                    >
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                )}

                <Dialog open={mobileGroupsOpen} onOpenChange={setMobileGroupsOpen}>
                    <DialogContent className="w-[95vw] max-w-md max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Delegate to Groups</DialogTitle>
                        </DialogHeader>
                        <GroupsPanel
                            groups={groups}
                            checkedIds={trayChecked}
                            onToggleGroup={toggleTrayGroup}
                            onClearChecked={() => setTrayChecked(new Set())}
                            onApply={handleApplyFromTray}

                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}