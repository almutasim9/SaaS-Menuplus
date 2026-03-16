export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-3">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-7 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-border/50 p-5 space-y-4">
                <div className="h-5 w-40 bg-muted rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-2">
                        <div className="h-4 w-4 bg-muted rounded-full" />
                        <div className="h-4 flex-1 bg-muted rounded" />
                        <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
