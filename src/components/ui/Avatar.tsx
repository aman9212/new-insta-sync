import { Icon } from "./Icon";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

export function Avatar({ src, alt = "", size = "md", fallback }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover bg-surface border border-border shrink-0 shadow-sm`}
      />
    );
  }

  const initials = fallback
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full bg-accent-subtle text-accent border border-accent/20
        flex items-center justify-center font-bold shrink-0
      `}
      aria-label={alt || fallback || "Avatar"}
    >
      {initials || <Icon name="user" size={size === "sm" ? 12 : size === "md" ? 16 : 20} />}
    </div>
  );
}