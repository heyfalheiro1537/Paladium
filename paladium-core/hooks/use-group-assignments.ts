import { ImageItem } from "@/types/image_group";
import { useCallback, useState } from "react";

export default function useGroupAssignments(initialImages: ImageItem[]) {
    const [images, setImages] = useState<ImageItem[]>(initialImages)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    const assignMultipleGroups = useCallback((imageIds: string[], groupIds: string[]) => {
        setImages((prev) =>
            prev.map((img) => {
                if (imageIds.includes(img.id)) {
                    const newGroupIds = [...new Set([...img.groupIds, ...groupIds])]
                    return { ...img, groupIds: newGroupIds }
                }
                return img
            })
        )
        showToast(`Assigned ${imageIds.length} image(s) to ${groupIds.length} group(s)`)
    }, [showToast])

    const removeFromGroup = useCallback((imageIds: string[], groupId: string) => {
        setImages((prev) =>
            prev.map((img) => {
                if (imageIds.includes(img.id)) {
                    return { ...img, groupIds: img.groupIds.filter((gid) => gid !== groupId) }
                }
                return img
            })
        )
        showToast(`Removed from group`)
    }, [showToast])

    const addImage = useCallback((newImage: ImageItem) => {
        setImages((prev) => [...prev, newImage])
        showToast('Image uploaded successfully')
    }, [showToast])

    return {
        images,
        setImages,  // Add this to the return
        assignMultipleGroups,
        removeFromGroup,
        addImage,
        toast
    }
}