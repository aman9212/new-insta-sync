import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({ label, value, icon, subtitle, trend, trendValue }: StatCardProps) {
  return (
    <div className="cx-premium-card surface-card-elevated p-5">
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary tabular-nums">{value}</div>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {trend && (
            <span className={
              trend === 'up' ? 'text-success' :
              trend === 'down' ? 'text-danger' :
              'text-text-muted'
            }>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
          {trendValue && <span className="text-text-muted">{trendValue}</span>}
          {subtitle && <span className="text-text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
