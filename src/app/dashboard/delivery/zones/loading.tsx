export default function DeliveryZonesLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-8 w-44 bg-muted rounded-xl" />
                <div className="h-10 w-32 bg-muted rounded-xl" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-32 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="h-7 w-20 bg-muted rounded-full" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
