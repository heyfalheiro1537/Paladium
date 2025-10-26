import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTagEditorProps {
    tags: string[];
    imageId: string;
    onTagRename: (imageId: string, oldTag: string, newTag: string) => void;
}

interface UseTagEditorReturn {
    editingTag: string | null;
    editValue: string;
    error: string | null;
    startEditing: (tag: string) => void;
    cancelEditing: () => void;
    saveEditing: () => void;
    setEditValue: (value: string) => void;
    isEditing: (tag: string) => boolean;
    isDuplicate: (name: string) => boolean;
    setError: (error: string | null) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useTagEditor({ tags, imageId, onTagRename }: UseTagEditorProps): UseTagEditorReturn {
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingTag && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingTag]);

    const isDuplicate = useCallback(
        (name: string) => {
            const v = name.trim();
            if (!editingTag) return false;
            const lower = v.toLowerCase();
            const original = editingTag.toLowerCase();
            return lower !== original && tags.some(t => t.toLowerCase() === lower);
        },
        [tags, editingTag]
    );

    // Clear error when the current value becomes valid
    useEffect(() => {
        const v = editValue.trim();
        if (error) {
            if (v && !isDuplicate(v)) setError(null);
        }
    }, [editValue, isDuplicate, error]);

    const startEditing = useCallback((tag: string) => {
        setEditingTag(tag);
        setEditValue(tag);
        setError(null);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingTag(null);
        setEditValue('');
        setError(null);
    }, []);

    const saveEditing = useCallback(() => {
        if (!editingTag) return;

        const v = editValue.trim();
        if (!v) {
            setError('Tag name cannot be empty');
            return;
        }

        if (v === editingTag) {
            cancelEditing();
            return;
        }

        if (isDuplicate(v)) {
            setError('Tag already exists');
            return;
        }

        onTagRename(imageId, editingTag, v);
        setEditingTag(null);
        setEditValue('');
        setError(null);
    }, [editingTag, editValue, imageId, onTagRename, isDuplicate, cancelEditing]);

    const isEditing = useCallback((tag: string) => editingTag === tag, [editingTag]);

    return {
        editingTag,
        editValue,
        error,
        startEditing,
        cancelEditing,
        saveEditing,
        setEditValue,
        isEditing,
        isDuplicate,
        setError,
        inputRef,
    };
}