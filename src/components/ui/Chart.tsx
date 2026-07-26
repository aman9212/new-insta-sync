import { useMemo } from "react";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface MiniChartProps {
  data: ChartDataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}

export function MiniChart({
  data,
  height = 120,
  strokeColor = "#a78bfa",
  fillColor = "rgba(167, 139, 250, 0.1)",
}: MiniChartProps) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const minVal = Math.min(...data.map((d) => d.value), 0);
    const range = maxVal - minVal;
    return data
      .map((d, index) => {
        const x = (index / (data.length - 1 || 1)) * 100;
        const y = 100 - ((d.value - minVal) / range) * 80 - 10; // margin top/bottom
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  const fillPoints = useMemo(() => {
    if (data.length === 0) return "";
    return `0,100 ${points} 100,100`;
  }, [data, points]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-text-muted"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <polygon points={fillPoints} fill={fillColor} />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface PremiumChartProps {
  data: ChartDataPoint[];
  label: string;
  height?: number;
  color?: "violet" | "emerald" | "danger";
}

const colorConfigs = {
  violet: {
    stroke: "#a78bfa",
    fill: "rgba(167, 139, 250, 0.15)",
    gradient: "from-accent to-accent-hover",
  },
  emerald: {
    stroke: "#34d399",
    fill: "rgba(52, 211, 153, 0.15)",
    gradient: "from-success to-success-hover",
  },
  danger: {
    stroke: "#f87171",
    fill: "rgba(248, 113, 113, 0.15)",
    gradient: "from-danger to-danger-hover",
  },
};

export function PremiumChart({
  data,
  label,
  height = 160,
  color = "violet",
}: PremiumChartProps) {
  const config = colorConfigs[color];
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text-primary tabular-nums">
          {maxValue.toLocaleString()}
        </p>
      </div>
      <MiniChart
        data={data}
        height={height}
        strokeColor={config.stroke}
        fillColor={config.fill}
      />
    </div>
  );
}
