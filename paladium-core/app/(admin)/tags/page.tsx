"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, X, Download } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTagEditor } from "@/hooks/use-tag-editor"
import { Annotation } from "@/types/annotation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;



export default function QualityAssurancePage() {
    const [data, setData] = useState<Annotation[]>([])
    const [selectedImage, setSelectedImage] = useState<Annotation | null>(null)
    const [editableTags, setEditableTags] = useState<string[]>([])

    const [tagToRemove, setTagToRemove] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [downloadingCSV, setDownloadingCSV] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])


    useEffect(() => {
        if (selectedImage) {
            setEditableTags(selectedImage.tags.map(t => t.name))
        }
    }, [selectedImage?.id])
    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/images/`)
            if (!response.ok) throw new Error('Failed to fetch images')

            const images = await response.json()


            // Transform API data to match our Annotation interface
            const transformedData: Annotation[] = images.map((img: any) => ({
                id: String(img.id),
                imageUrl: `${API_BASE_URL}${img.url}`,
                tags: img.tags.map((tag: any) => ({
                    name: tag.name,
                    percentage: tag.percentage || 0,
                    count: tag.count || 0
                })),
                hasConflict: img.has_conflict || false,
                totalAnnotators: img.total_annotators || 0
            }))

            setData(transformedData)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load images')
        } finally {
            setLoading(false)
        }
    }


    // Inside your component, after selectedImage is defined:
    const tagEditor = useTagEditor({
        tags: editableTags,
        imageId: selectedImage?.id || '',
        onTagRename: async (imageId, oldTag, newTag) => {
            try {
                const response = await fetch(`${API_BASE_URL}/images/${imageId}/tags/${encodeURIComponent(oldTag)}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        new_tag_name: newTag
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Failed to rename tag');
                }

                const result = await response.json();

                // Only update local state if API call succeeds
                setData(curr =>
                    curr.map(img =>
                        img.id === imageId
                            ? {
                                ...img,
                                tags: img.tags.map(t =>
                                    t.name === oldTag ? { ...t, name: newTag } : t
                                )
                            }
                            : img
                    )
                );

                setEditableTags(prev => prev.map(t => t === oldTag ? newTag : t));



            } catch (error: any) {
                console.error('Error renaming tag:', error);
                alert(`Failed to rename tag: ${error.message}`);
            }
        }
    });

    const handleImageClick = (annotation: Annotation) => {
        setSelectedImage(annotation)
    }


    const confirmRemoveTag = (tagName: string) => {
        setTagToRemove(tagName)
    }

    const handleRemoveTag = async (imageId: string, tagToRemove: string) => {
        try {

            const response = await fetch(
                `${API_BASE_URL}/images/${imageId}/tags/${encodeURIComponent(tagToRemove)}`,
                {
                    method: 'DELETE'
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to remove tag')
            }

            const result = await response.json()

            // Update local state
            setData(curr =>
                curr.map(img =>
                    img.id === imageId
                        ? { ...img, tags: img.tags.filter(t => t.name !== tagToRemove) }
                        : img
                )
            )

            setEditableTags(prev => prev.filter(t => t !== tagToRemove))
            setTagToRemove(null)

            toast.success(result.message || `Tag "${tagToRemove}" removed`)

            await fetchData()
        } catch (error) {
            console.error('Error removing tag:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove tag'
            toast.error(errorMessage)
        }
    }
    const downloadAnnotations = async () => {
        setDownloading(true);


        try {
            const response = await fetch(API_BASE_URL + '/annotations/');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Convert to JSON string with pretty formatting
            const jsonString = JSON.stringify(data, null, 2);

            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `annotations_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } finally {
            setDownloading(false);
        }
    };

    const downloadAsCSV = async () => {
        setDownloadingCSV(true);


        try {
            const response = await fetch(API_BASE_URL + '/annotations/');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Convert to CSV
            if (data.annotations && data.annotations.length > 0) {
                const headers = ['annotation_id', 'image_id', 'annotator_id', 'annotator_name', 'image_filename', 'tags', 'created_at', 'updated_at'];
                const csvRows = [headers.join(',')];

                data.annotations.forEach((annotation: any) => {
                    const row = [
                        annotation.annotation_id,
                        annotation.image_id,
                        annotation.annotator_id,
                        annotation.annotator_name || '',
                        annotation.image_filename || '',
                        `"${annotation.tags.join('; ')}"`,
                        annotation.created_at || '',
                        annotation.updated_at || ''
                    ];
                    csvRows.push(row.join(','));
                });

                const csvString = csvRows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `annotations_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }

        } finally {
            setDownloadingCSV(false);
        }
    };




    const handleCloseModal = () => {
        setSelectedImage(null)
    }

    const getAgreementColor = (percentage: number) => {
        if (percentage >= 80) return "text-green-600"
        if (percentage >= 60) return "text-amber-600"
        return "text-destructive"
    }

    const avgAgreement = data.length > 0 ? Math.round(
        data.reduce((sum, img) => {
            const avg = img.tags.length > 0
                ? img.tags.reduce((s, t) => s + t.percentage, 0) / img.tags.length
                : 0
            return sum + avg
        }, 0) / data.length
    ) : 0

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading tags...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="p-4 sm:p-6">

                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Tag Management</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Review annotation consistency and resolve conflicts across labeled images
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:min-w-fit">
                            <button
                                onClick={downloadAnnotations}
                                disabled={downloading}
                                className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap"
                            >
                                {downloading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm">Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm">JSON</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={downloadAsCSV}
                                disabled={downloadingCSV}
                                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-medium py-2 px-4 rounded-lg transition-colors duration-200 border border-gray-300 whitespace-nowrap"
                            >
                                {downloadingCSV ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm">Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm">CSV</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Images</div>
                        <div className="text-xl sm:text-2xl font-semibold text-foreground">{data.length}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">With Conflicts</div>
                        <div className="text-xl sm:text-2xl font-semibold text-amber-600">
                            {data.filter((a) => a.hasConflict).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg Agreement</div>
                        <div className="text-xl sm:text-2xl font-semibold text-green-600">{avgAgreement}%</div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">Image</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">Tags</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm hidden sm:table-cell">Agreement</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs sm:text-sm">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((annotation) => (
                                    <TableRow
                                        key={annotation.id}
                                        className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                                        onClick={() => handleImageClick(annotation)}
                                    >
                                        <TableCell>
                                            <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden bg-muted">
                                                <img
                                                    src={annotation.imageUrl}
                                                    alt="Annotation preview"
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                                {annotation.tags.map((tag) => (
                                                    <Badge
                                                        key={tag.name}
                                                        variant="secondary"
                                                        className="bg-secondary text-secondary-foreground font-mono text-xs pr-2"
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="space-y-1">
                                                {annotation.tags.map((tag) => (
                                                    <div key={tag.name} className="flex items-center gap-2 text-xs sm:text-sm">
                                                        <span className="text-muted-foreground font-mono w-[200px] truncate">{tag.name}</span>
                                                        <span className={`font-semibold font-mono ${getAgreementColor(tag.percentage)}`}>
                                                            {tag.percentage}%
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">
                                                            ({tag.count}/{annotation.totalAnnotators})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {annotation.tags.length === 0 || annotation.totalAnnotators === 0 ? (
                                                <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span className="text-xs sm:text-sm font-medium">Not enough data</span>
                                                </div>
                                            ) : annotation.hasConflict ? (
                                                <div className="flex items-center gap-1 sm:gap-2 text-amber-600">
                                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span className="text-xs sm:text-sm font-medium">Conflict</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                                                    <div className="h-2 w-2 rounded-full bg-green-600" />
                                                    <span className="text-xs sm:text-sm font-medium">Resolved</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Annotation Detail Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={handleCloseModal}>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Annotation Review</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Review and edit tags for this image. Changes are saved immediately.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedImage && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4">
                            {/* Image Preview */}
                            <div className="space-y-4">
                                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted border border-border">
                                    <img
                                        src={selectedImage.imageUrl}
                                        alt="Full annotation preview"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                                    <div className="text-sm font-medium text-foreground">Original Annotations</div>
                                    {selectedImage.tags.map((tag) => (
                                        <div key={tag.name} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground font-mono text-xs sm:text-sm">{tag.name}</span>
                                            <span className={`font-semibold font-mono text-xs sm:text-sm ${getAgreementColor(tag.percentage)}`}>
                                                {tag.percentage}% ({tag.count}/{selectedImage.totalAnnotators})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tag Editor */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">Current Tags</label>
                                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                                        {editableTags.length === 0 ? (
                                            <span className="text-muted-foreground text-sm">No tags added yet</span>
                                        ) : (
                                            <>
                                                {editableTags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="default"
                                                        className="bg-primary text-primary-foreground font-mono flex items-center gap-1 text-xs sm:text-sm h-7 px-2"
                                                    >
                                                        {tagEditor.isEditing(tag) ? (
                                                            <input
                                                                ref={tagEditor.inputRef}
                                                                type="text"
                                                                value={tagEditor.editValue}
                                                                onChange={(e) => {
                                                                    const v = e.target.value;
                                                                    tagEditor.setEditValue(v);
                                                                    if (tagEditor.isDuplicate(v)) {
                                                                        tagEditor.setError('Tag already exists');
                                                                    } else if (!v.trim()) {
                                                                        tagEditor.setError('Tag name cannot be empty');
                                                                    } else {
                                                                        tagEditor.setError(null);
                                                                    }
                                                                }}

                                                                onBlur={tagEditor.saveEditing}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        tagEditor.saveEditing();
                                                                    } else if (e.key === 'Escape') {
                                                                        tagEditor.cancelEditing();
                                                                    }
                                                                }}
                                                                className={`bg-primary-foreground/20 text-primary-foreground px-1 rounded outline-none focus:ring-1 w-24 ${tagEditor.error
                                                                    ? 'ring-2 ring-red-500 focus:ring-red-500'
                                                                    : 'focus:ring-primary-foreground/50'
                                                                    }`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            <span
                                                                onClick={() => tagEditor.startEditing(tag)}
                                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                            >
                                                                {tag}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => confirmRemoveTag(tag)}
                                                            className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                                                            aria-label={`Remove tag ${tag}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}

                                                {/* Error message */}
                                                {tagEditor.error && (
                                                    <div className="w-full text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {tagEditor.error}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>



                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Tag Removal */}
            <AlertDialog open={!!tagToRemove} onOpenChange={() => setTagToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove the tag "{tagToRemove}"? This action will be saved immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedImage && tagToRemove && handleRemoveTag(selectedImage.id, tagToRemove)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}