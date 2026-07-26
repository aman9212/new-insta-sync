// All monetary values are stored as integer cents (bigint in PostgreSQL, number in JS).

export const CENTS_PER_DOLLAR = 100;

export function centsToDollars(cents: number): number {
  return Math.round(cents) / CENTS_PER_DOLLAR;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToDollars(cents));
}

export function formatCentsCompact(cents: number): string {
  const dollars = centsToDollars(cents);
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}M`;
  }
  if (dollars >= 1_000) {
    return `$${(dollars / 1_000).toFixed(1)}K`;
  }
  return formatCents(cents);
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return views.toLocaleString();
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatRatePerMillion(ratePerMillionCents: number): string {
  return `${formatCents(ratePerMillionCents)} / 1M views`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Tabular number formatting for financial displays
export function formatCentsTabular(cents: number): string {
  const dollars = centsToDollars(cents);
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Safe earnings calculation (for reference — actual calculation happens server-side)
export function calculateGrossEarnings(eligibleViews: number, ratePerMillionCents: number): number {
  if (eligibleViews <= 0 || ratePerMillionCents <= 0) return 0;
  // Integer math: (views * rate) / 1_000_000
  // Use Math.floor to avoid floating-point rounding
  return Math.floor((eligibleViews * ratePerMillionCents) / 1_000_000);
}
