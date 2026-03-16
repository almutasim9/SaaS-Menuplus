export default function AnalyticsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-40 bg-muted rounded-xl" />
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-3">
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-8 w-20 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-4">
                        <div className="h-5 w-36 bg-muted rounded" />
                        <div className="h-52 bg-muted rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
