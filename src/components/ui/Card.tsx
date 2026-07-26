import { useRef } from "react";
import type { HTMLAttributes } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

type CardVariant = "default" | "elevated" | "glass" | "outline";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "cx-premium-card bg-surface/80 backdrop-blur-2xl border border-white/10 shadow-xl shadow-black/20",
  elevated: "cx-premium-card cx-premium-card-raised bg-surface-elevated/90 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/40",
  glass: "cx-premium-card glass border border-white/15 shadow-2xl",
  outline: "bg-transparent border border-white/15",
};

export function Card({
  variant = "default",
  hover = false,
  padding = true,
  className = "",
  children,
  ...props
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const rotateX = useSpring(useMotionValue(0), { damping: 30, stiffness: 400 });
  const rotateY = useSpring(useMotionValue(0), { damping: 30, stiffness: 400 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    mouseX.set((mouseXPos / width) * 100);
    mouseY.set((mouseYPos / height) * 100);

    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    rotateX.set(yPct * -10); // max rotation degrees
    rotateY.set(xPct * 10);
  }

  function handleMouseLeave() {
    if (!hover) return;
    rotateX.set(0);
    rotateY.set(0);
    mouseX.set(50);
    mouseY.set(50);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        hover
          ? {
              rotateX,
              rotateY,
              transformPerspective: 1000,
              // @ts-ignore - passing custom css vars to style
              "--mouse-x": useMotionTemplate`${mouseX}%`,
              "--mouse-y": useMotionTemplate`${mouseY}%`,
            }
          : undefined
      }
      className={`
        relative rounded-[28px] transition-all duration-300 ease-out group overflow-hidden
        ${variantStyles[variant]}
        ${hover ? "cursor-pointer hover:border-accent/40" : ""}
        ${className}
      `}
      {...props}
    >
      {hover && (
        <>
          <div className="luxury-card-overlay" />
          <div className="luxury-card-border" />
        </>
      )}
      <div className={`relative z-10 h-full w-full ${padding ? "p-6" : ""}`}>
        {children}
      </div>
    </motion.div>
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-text-muted ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props} />
  );
}
