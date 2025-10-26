import { Tag } from "./tag"

export interface Annotation {
    id: string
    imageUrl: string
    tags: Tag[]
    hasConflict: boolean
    totalAnnotators: number
}
