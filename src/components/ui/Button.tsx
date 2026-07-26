import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "glass" | "white" | "dark";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "btn-3d bg-gradient-to-b from-accent-hover to-accent-strong text-white border border-accent-strong shadow-[0_4px_0_var(--color-accent-strong),0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-110 active:shadow-[0_0px_0_var(--color-accent-strong),0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-150",
  secondary:
    "bg-surface text-text-primary border border-border shadow-[0_3px_0_var(--color-border-strong),0_4px_6px_rgba(0,0,0,0.2),inset_0_1px_1px_var(--color-bezel)] hover:bg-surface-hover hover:border-border-strong active:shadow-[0_0px_0_var(--color-border-strong),0_1px_2px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-[3px] transition-all duration-150",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:shadow-[inset_0_1px_1px_var(--color-bezel)] active:bg-surface transition-all duration-200",
  danger: "bg-danger/15 text-danger border border-danger/30 shadow-[0_3px_0_rgba(239,68,68,0.3)] hover:bg-danger/25 hover:border-danger/50 active:shadow-[0_0px_0_rgba(239,68,68,0.3)] active:translate-y-[3px] transition-all duration-150",
  outline: "border border-border text-text-primary hover:bg-surface-hover shadow-[0_2px_0_var(--color-border)] hover:border-border-strong active:shadow-[0_0px_0_var(--color-border)] active:translate-y-[2px] transition-all duration-150",
  glass: "glass text-text-primary hover:bg-surface-hover shadow-[0_3px_0_var(--color-border-strong),inset_0_1px_1px_var(--color-bezel)] active:shadow-none active:translate-y-[3px] transition-all duration-150",
  white:
    "bg-text-primary text-text-inverse border border-text-primary shadow-[0_4px_0_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:opacity-90 active:shadow-none active:translate-y-[4px] transition-all duration-150 font-semibold",
  dark:
    "bg-bg-secondary text-text-primary border border-border shadow-[0_3px_0_var(--color-border-strong),inset_0_1px_1px_var(--color-bezel)] hover:bg-surface-hover hover:border-border-strong active:shadow-none active:translate-y-[3px] transition-all duration-150 font-semibold",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-[12px]",
  lg: "h-12 px-6 text-base gap-2.5 rounded-[20px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, className = "", children, leftIcon, rightIcon, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-200 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Icon name="loader-2" size={size === "sm" ? 14 : 16} animation="spin" className="shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
