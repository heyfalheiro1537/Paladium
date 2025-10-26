"use client"

import * as React from "react"
import { Upload, File as FileIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

export type FileUploadDrawerProps = {
    /** Called when user confirms upload */
    onFileSelected?: (file: File) => void | Promise<void>
    /** Input accept filter, e.g. "image/*,.pdf" */
    accept?: string
    /** Max size in MB (default 10) */
    maxSizeMB?: number
    /** Optional trigger content; defaults to a button */
    trigger?: React.ReactNode
    /** Optional title/description overrides */
    title?: string
    description?: string
}

export function FileUploadDrawer({
    onFileSelected,
    accept = "*",
    maxSizeMB = 10,
    trigger,
    title = "Upload a file",
    description = "Drag & drop a file here, or click to select from your device.",
}: FileUploadDrawerProps) {
    const [open, setOpen] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [submitting, setSubmitting] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const openPicker = () => inputRef.current?.click()

    const validate = (f: File) => {
        const maxBytes = maxSizeMB * 1024 * 1024
        if (f.size > maxBytes) throw new Error(`File is too large. Max ${maxSizeMB} MB.`)
    }

    const handleFiles = (files: FileList | null) => {
        setError(null)
        if (!files || files.length === 0) return
        const f = files[0]
        try {
            validate(f)
            setFile(f)
        } catch (e) {
            setFile(null)
            setError((e as Error).message)
        }
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        // reset so same file can be picked again
        e.currentTarget.value = ""
    }

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        handleFiles(e.dataTransfer.files)
    }

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }

    const clear = () => {
        setFile(null)
        setError(null)
    }

    const submit = async () => {
        if (!file) return
        setSubmitting(true)
        setError(null)
        try {
            await onFileSelected?.(file)
            // success → close drawer and clear selection
            setOpen(false)
            clear()
        } catch (e) {
            setError((e as Error).message || "Upload failed")
        } finally {
            setSubmitting(false)
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
    }

    return (
        <Drawer open={open} onOpenChange={(o) => {
            setOpen(o)
            if (!o) clear()
        }}>
            <DrawerTrigger asChild>
                {trigger ?? (
                    <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
                        <Upload className="h-4 w-4" />
                        Upload file
                    </Button>
                )}
            </DrawerTrigger>

            <DrawerContent>
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                        <DrawerDescription>{description}</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 pt-0">
                        {/* Hidden input for native picker */}
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={onChange}
                        />

                        {/* Dropzone */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={openPicker}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") openPicker()
                            }}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 p-8 text-center transition hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Upload className="mb-3 h-6 w-6 opacity-70 group-hover:opacity-100" />
                            <p className="text-sm">
                                <span className="font-medium underline underline-offset-4">Click to choose</span>{" "}
                                or drag & drop
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Accepted: <span className="font-medium">{accept}</span> · Max {maxSizeMB} MB
                            </p>
                        </div>

                        {/* Selection / error state */}
                        <div className="mt-4 space-y-3">
                            {file && (
                                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                                    <div className="flex items-center gap-3">
                                        <FileIcon className="h-5 w-5" />
                                        <div className="text-sm">
                                            <div className="font-medium">{file.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {file.type || "—"} · {formatBytes(file.size)}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={clear} disabled={submitting}>
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Remove file</span>
                                    </Button>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={submit} disabled={!file || submitting}>
                            {submitting ? "Uploading..." : "Upload file"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" disabled={submitting}>Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
