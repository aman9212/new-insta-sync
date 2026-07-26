export function CampaignProgress({ used, total }: { used: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-text-muted">
        <span>Budget usage</span>
        <span className="font-medium tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-elevated border border-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
