import { Badge } from "@/components/ui/badge";
export default function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
    return (
        <Badge variant="outline">
            {label}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="grid place-items-center rounded-full hover:bg-black/10 h-4 w-4 mr-2"
                    aria-label={`Remove ${label}`}
                >
                    ×
                </button>
            )}
        </Badge>
    );
}
