export default function MenuLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-xl" />
                <div className="h-10 w-36 bg-muted rounded-xl" />
            </div>
            {/* Category tabs */}
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-muted rounded-xl" />
                ))}
            </div>
            {/* Product rows */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-4 flex items-center gap-4">
                        <div className="h-14 w-14 bg-muted rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-muted rounded" />
                            <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                        <div className="h-6 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
