"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, X, CheckCircle2, Clock, LogOut, Loader2, BarChart3, Target } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { ImageData } from "@/types/image_data"
import { AnnotatorDashboard } from "@/components/ui/dashboard"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_TAGS = 3
const TAG_REGEX = /^[a-zA-Z0-9-_]+$/

export default function UserClassificationPage() {
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
    const [editableTags, setEditableTags] = useState<string[]>([])
    const [newTagInput, setNewTagInput] = useState("")
    const [images, setImages] = useState<ImageData[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isAISuggesting, setIsAISuggesting] = useState(false)
    const [stats, setStats] = useState<{
        totalImages: number
        classifiedImages: number
        remainingImages: number
        progressPercentage: number
    } | null>(null)


    const { user, logout } = useAuth()
    const [CURRENT_ANNOTATOR_ID, setCurrentAnnotatorId] = useState<string>("")

    useEffect(() => {
        if (!user?.id) {
            return // Aguarda o user carregar
        }

        const annotatorId = String(user.id)
        setCurrentAnnotatorId(annotatorId)

        const loadData = async () => {
            await fetchImages(annotatorId)
            const statsData = await fetchAnnotatorStats(annotatorId)
            if (statsData) setStats(statsData)
        }
        loadData()
    }, [user?.id]);

    const fetchImages = async (annotatorId: string) => {
        try {


            const response = await fetch(`${API_BASE_URL}/annotations/images/${annotatorId}`)

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Annotator not found')
                }
                throw new Error('Failed to fetch images')
            }

            const data = await response.json()
            const transformedData: ImageData[] = data.map((img: any) => ({
                id: String(img.id),
                name: img.name,
                url: `${API_BASE_URL}${img.url}`,
                tags: img.tags || [],
                is_classified: img.is_classified || false,
                classified_at: img.classified_at,
                date_added: img.date_added
            }))

            setImages(transformedData)
        } catch (error) {
            console.error('Error fetching images:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to load images'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
    }

    const classifiedImages = images.filter(img => img.is_classified)
    const unclassifiedImages = images.filter(img => !img.is_classified)

    const handleImageClick = (image: ImageData) => {
        setSelectedImage(image)
        setEditableTags([...image.tags])
        setNewTagInput("")
    }

    const validateTag = (tag: string): { valid: boolean; error?: string } => {
        const trimmed = tag.trim()

        if (!trimmed) {
            return { valid: false, error: "Tag cannot be empty" }
        }

        if (!TAG_REGEX.test(trimmed)) {
            return { valid: false, error: "Tag can only contain letters, numbers, hyphens, and underscores" }
        }

        if (editableTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            return { valid: false, error: "Tag already exists" }
        }

        return { valid: true }
    }

    const handleAddTag = () => {
        const validation = validateTag(newTagInput)

        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        if (editableTags.length >= MAX_TAGS) {
            toast.error(`Maximum ${MAX_TAGS} tags allowed`)
            return
        }

        const normalizedTag = newTagInput.trim().toLowerCase()

        // Check for duplicates
        if (editableTags.some(tag => tag.toLowerCase() === normalizedTag)) {
            toast.error("Tag already added")
            return
        }

        setEditableTags([...editableTags, normalizedTag])
        setNewTagInput("")
    }


    const handleRemoveTag = async (selectedImageId: string, tagToRemove: string) => {
        setEditableTags(editableTags.filter((tag) => tag !== tagToRemove))
        const response = await fetch(`${API_BASE_URL}/images/${selectedImageId}/annotations/${CURRENT_ANNOTATOR_ID}/tags/${tagToRemove}`, {
            method: 'DELETE'
        })
        if (!response.ok) {
            const errorData = await response.json()

        }

    }

    const handleAISuggest = async () => {
        if (!selectedImage) return

        setIsAISuggesting(true)
        try {
            const response = await fetch(`${API_BASE_URL}/annotations/ai-suggest/${selectedImage.id}`, {
                method: 'GET'
            })

            if (!response.ok) throw new Error('Failed to get AI suggestions')

            const data = await response.json()
            const suggestions = data.suggestions || []

            const availableSlots = MAX_TAGS - editableTags.length

            const newTags = suggestions
                .slice(0, availableSlots)
                .filter((tag: string) => !editableTags.some(t => t.toLowerCase() === tag.toLowerCase()))


            if (newTags.length === 0) {
                toast.info("No new tag suggestions available")
                return
            }

            setEditableTags([...editableTags, ...newTags])
            toast.success(`Added ${newTags.length} AI-suggested tag${newTags.length > 1 ? 's' : ''}`)
        } catch (error) {
            console.error('Failed to get AI suggestions:', error)
            toast.error("Failed to get AI suggestions")
        } finally {
            setIsAISuggesting(false)
        }
    }

    const handleSaveClassification = async () => {
        if (!selectedImage) return

        if (editableTags.length === 0) {
            toast.error("Please add at least one tag")
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`${API_BASE_URL}/annotations/${CURRENT_ANNOTATOR_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_id: parseInt(selectedImage.id),
                    tag_names: editableTags
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to save annotation')
            }

            const result = await response.json()
            toast.success(result.message || "Classification saved successfully")
            const statsData = await fetchAnnotatorStats(CURRENT_ANNOTATOR_ID)
            if (statsData) setStats(statsData)
            setSelectedImage(null)
            setEditableTags([])

            // Refresh images
            await fetchImages(CURRENT_ANNOTATOR_ID)
        } catch (error) {
            console.error('Failed to save classification:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to save classification'
            toast.error(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    const fetchAnnotatorStats = async (annotatorId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/annotations/stats/${annotatorId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch stats')
            }

            const data = await response.json()
            return {
                totalImages: data.total_images,
                classifiedImages: data.classified_images,
                remainingImages: data.remaining_images,
                progressPercentage: data.progress_percentage
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
            return null
        }
    }

    const renderImageTable = (imageList: ImageData[]) => (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                            <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm text-left">Image</TableHead>
                            <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm text-left">Tags</TableHead>
                            <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm text-left">Status</TableHead>
                            {imageList.some(img => img.is_classified) && (
                                <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm text-left">Classified</TableHead>
                            )}
                            {!imageList.some(img => img.is_classified) && (
                                <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm text-left">Date Added</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {imageList.map((image) => (
                            <TableRow
                                key={image.id}
                                className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                                onClick={() => handleImageClick(image)}
                            >
                                <TableCell>
                                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden bg-muted">
                                        <img
                                            src={image.url}
                                            alt="Image preview"
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {image.tags.length > 0 ? (
                                            image.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="bg-secondary text-secondary-foreground font-mono text-xs pr-2"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No tags</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {image.is_classified ? (
                                        <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-xs sm:text-sm font-medium">Classified</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 sm:gap-2 text-amber-600">
                                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-xs sm:text-sm font-medium">Pending</span>
                                        </div>
                                    )}
                                </TableCell>
                                {imageList.some(img => img.is_classified) && image.is_classified && (
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(image.classified_at)}
                                        </span>
                                    </TableCell>
                                )}
                                {!imageList.some(img => img.is_classified) && (
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(image.date_added)}
                                        </span>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Image Classification</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Classify images by adding up to {MAX_TAGS} tags per image
                            </p>
                        </div>
                        <Button onClick={handleLogout} variant="outline" className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
                <AnnotatorDashboard stats={stats ? {
                    total_images: stats.totalImages,
                    classified_images: stats.classifiedImages,
                    remaining_images: stats.remainingImages,
                    progress_percentage: stats.progressPercentage
                } : null} loading={loading} />

                <div className="my-8 border-t border-border"></div>
                {/* Tabs for Classified/Unclassified */}
                <Tabs defaultValue="unclassified" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="unclassified" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Unclassified ({unclassifiedImages.length})
                        </TabsTrigger>
                        <TabsTrigger value="classified" className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Classified ({classifiedImages.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="unclassified" className="mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">Unclassified Images</h2>
                                <span className="text-sm text-muted-foreground">
                                    {unclassifiedImages.length} images need classification
                                </span>
                            </div>
                            {renderImageTable(unclassifiedImages)}
                        </div>
                    </TabsContent>

                    <TabsContent value="classified" className="mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground">Classified Images</h2>
                                <span className="text-sm text-muted-foreground">
                                    {classifiedImages.length} images completed
                                </span>
                            </div>
                            {renderImageTable(classifiedImages)}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Classification Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Classify Image</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Add up to {MAX_TAGS} tags to classify this image.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedImage && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4">
                            {/* Image Preview */}
                            <div className="space-y-4">
                                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border border-border">
                                    <img
                                        src={selectedImage.url}
                                        alt="Full image preview"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                                    <div className="text-sm font-medium text-foreground">Current Classification</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedImage.tags.length > 0 ? (
                                            selectedImage.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="bg-secondary text-secondary-foreground font-mono text-xs pr-2"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No tags assigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tag Editor */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        Current Tags ({editableTags.length}/{MAX_TAGS})
                                    </label>
                                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                                        {editableTags.length === 0 ? (
                                            <span className="text-muted-foreground text-sm">No tags added yet</span>
                                        ) : (
                                            editableTags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="default"
                                                    className="bg-primary text-primary-foreground font-mono flex items-center gap-1 text-xs sm:text-sm h-7 pr-2"
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => handleRemoveTag(selectedImage.id, tag)}
                                                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                                                        aria-label={`Remove tag ${tag}`}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Add New Tag</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    handleAddTag()
                                                }
                                            }}
                                            placeholder={editableTags.length >= MAX_TAGS ? `Maximum ${MAX_TAGS} tags reached` : "Type tag name..."}
                                            disabled={editableTags.length >= MAX_TAGS}
                                            className={`bg-input text-foreground placeholder:text-muted-foreground flex-1 ${newTagInput.trim() && !validateTag(newTagInput.trim()).valid
                                                ? 'border-destructive focus-visible:ring-destructive cursor-not-allowed'
                                                : 'border-border cursor-text'
                                                }`}
                                        />
                                        <Button
                                            onClick={handleAddTag}
                                            variant="secondary"
                                            className="w-full sm:w-auto"
                                            disabled={editableTags.length >= MAX_TAGS || !newTagInput.trim() || !validateTag(newTagInput.trim()).valid}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <p className={`text-xs mt-1 ${newTagInput.trim() && !validateTag(newTagInput.trim()).valid
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                        }`}>
                                        {newTagInput.trim() && !validateTag(newTagInput.trim()).valid
                                            ? validateTag(newTagInput.trim()).error
                                            : `Use letters, numbers, hyphens, and underscores only${editableTags.length >= MAX_TAGS ? ` (max ${MAX_TAGS} tags)` : ''}`}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleAISuggest}
                                    variant="outline"
                                    className="w-full border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
                                    disabled={editableTags.length >= MAX_TAGS || isAISuggesting}
                                >
                                    {isAISuggesting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating suggestions...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Suggest tags (AI)
                                        </>
                                    )}
                                </Button>

                                <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
                                    <Button
                                        onClick={() => setSelectedImage(null)}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveClassification}
                                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                        disabled={saving || editableTags.length === 0}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Classification"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}