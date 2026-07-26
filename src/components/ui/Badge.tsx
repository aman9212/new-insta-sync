import type { ReactNode } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-elevated text-text-secondary border border-border",
  accent: "bg-accent-subtle text-accent border border-accent/20",
  success: "bg-success-subtle text-success border border-success/20",
  warning: "bg-warning-subtle text-warning border border-warning/20",
  danger: "bg-danger-subtle text-danger border border-danger/20",
  neutral: "bg-surface text-text-muted border border-border",
};

const sizeStyles: Record<"sm" | "md", string> = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export function Badge({ variant = "default", size = "md", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    // Campaign statuses
    draft: { variant: "neutral", label: "Draft" },
    pending_review: { variant: "warning", label: "Pending Review" },
    active: { variant: "success", label: "Active" },
    paused: { variant: "warning", label: "Paused" },
    completed: { variant: "default", label: "Completed" },
    rejected: { variant: "danger", label: "Rejected" },
    cancelled: { variant: "danger", label: "Cancelled" },
    // Submission statuses
    processing: { variant: "warning", label: "Processing" },
    eligible: { variant: "success", label: "Eligible" },
    ineligible: { variant: "danger", label: "Ineligible" },
    paid: { variant: "accent", label: "Paid" },
    // Withdrawal statuses
    pending: { variant: "warning", label: "Pending" },
    approved: { variant: "accent", label: "Approved" },
    processing_payout: { variant: "accent", label: "Processing" },
    paid_out: { variant: "success", label: "Paid Out" },
    failed: { variant: "danger", label: "Failed" },
    // Account statuses
    suspended: { variant: "danger", label: "Suspended" },
    banned: { variant: "danger", label: "Banned" },
    // Verification
  };

  const { variant, label } = config[status] ?? { variant: "default" as BadgeVariant, label: status };

  return <Badge variant={variant}>{label}</Badge>;
}