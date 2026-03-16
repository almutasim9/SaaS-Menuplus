export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="h-8 w-48 bg-muted rounded-xl" />
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-3">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-7 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>
            {/* Chart placeholder */}
            <div className="rounded-2xl border border-border/50 p-5 space-y-4">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-48 bg-muted rounded-xl" />
            </div>
        </div>
    );
}
