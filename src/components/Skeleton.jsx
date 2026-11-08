// Space-reserving placeholders, so content doesn't shift when it arrives.
export function Skeleton({ label, className = '', children }) {
    return (
        <div className={`skeleton-group ${className}`} role="status" aria-busy="true">
            <span className="visually-hidden">{label}</span>
            {children}
        </div>
    );
}

export function SkeletonBlock({ className = '', style }) {
    return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function BoardSkeleton({ label = 'Loading the puzzle' }) {
    return (
        <Skeleton label={label} className="skeleton-board">
            <span className="skeleton-board-main">
                <SkeletonBlock className="skeleton-line" />
                <SkeletonBlock className="skeleton-grid" />
            </span>
            <SkeletonBlock className="skeleton-panel" />
        </Skeleton>
    );
}

export function RowsSkeleton({ rows = 5, label = 'Loading' }) {
    return (
        <Skeleton label={label} className="skeleton-rows">
            {Array.from({ length: rows }, (_, i) => (
                <SkeletonBlock key={i} className="skeleton-row" />
            ))}
        </Skeleton>
    );
}

export function TilesSkeleton({ tiles = 4, label = 'Loading your stats' }) {
    return (
        <Skeleton label={label} className="stat-tiles skeleton-tiles">
            {Array.from({ length: tiles }, (_, i) => (
                <SkeletonBlock key={i} className="skeleton-tile" />
            ))}
        </Skeleton>
    );
}
