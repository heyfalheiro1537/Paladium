"use client"

import { useRef } from "react"
import { Button } from "./ui/button"
import { Upload } from "lucide-react"

export default function TopBar({ selectedCount, onClear, onSelectAll, totalCount, onImageUpload }: {
    selectedCount: number
    onClear: () => void
    onSelectAll: () => void
    totalCount: number
    onImageUpload: (file: File) => void
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file)
            e.target.value = ''
        }
    }


    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Image Assignment</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Organize and delegate images to groups for efficient workflow management
                    </p>
                </div>
                <div className="flex gap-2 mt-5">
                    <Button
                        onClick={onSelectAll}
                        variant="outline"
                        size="sm"
                        disabled={selectedCount === totalCount}
                        className="h-9"
                    >
                        Select All
                    </Button>
                    <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        size="sm"
                        className="h-9"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                    </Button>
                    <input
                        id="file-upload"
                        ref={(el) => { fileInputRef.current = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Upload image"
                    />
                </div>
            </div>
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                        {selectedCount} of {totalCount} selected
                    </span>
                    <Button
                        onClick={onClear}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                    >
                        Clear selection
                    </Button>
                </div>
            )}
        </div>
    )
}
