'use client'

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Image } from "lucide-react"
import { ImageItem } from "@/types/image_group"



export default function ImageCard({ image, isSelected, onToggle, onRemoveGroup, getGroupName }: {
    image: ImageItem
    isSelected: boolean
    onToggle: () => void
    onRemoveGroup: (groupId: string) => void
    getGroupName: (id: string) => string
}) {
    const [imageError, setImageError] = useState(false)

    return (
        <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`} onClick={onToggle}>
            <CardContent className="p-0" >
                <div className="relative aspect-square bg-neutral-100">
                    {imageError ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image className="h-12 w-12 text-neutral-300" />
                        </div>
                    ) : (
                        <img
                            src={image.url}
                            alt={image.alt || `Image ${image.id}`}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    )}
                    <div className="absolute top-2 left-2">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggle}
                            className="bg-white border-2"
                            aria-label={`Select image ${image.id}`}
                        />
                    </div>
                </div>
                {image.groupIds.length > 0 && (
                    <div className="p-3 space-y-1">
                        {image.groupIds.map((gid) => (
                            <div
                                key={gid}
                                className="flex items-center justify-between bg-blue-50 rounded px-2 py-1"
                            >
                                <span className="text-xs text-blue-700">{getGroupName(gid)}</span>
                                <button
                                    onClick={() => onRemoveGroup(gid)}
                                    className="text-blue-600 hover:bg-blue-100 rounded-full p-1"
                                    aria-label={`Remove from ${getGroupName(gid)}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}