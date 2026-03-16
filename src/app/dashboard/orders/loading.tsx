export default function OrdersLoading() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-36 bg-muted rounded-xl" />
            {/* Filter tabs */}
            <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 bg-muted rounded-xl" />
                ))}
            </div>
            {/* Order cards */}
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-24 bg-muted rounded" />
                        <div className="h-6 w-20 bg-muted rounded-full" />
                    </div>
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="flex gap-4">
                        <div className="h-4 w-16 bg-muted rounded" />
                        <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
