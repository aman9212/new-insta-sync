
interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = { sm: 18, md: 22, lg: 28 };

export function Logo({ size = "md", showText = true }: LogoProps) {
  const iconSize = sizeMap[size];
  return (
    <div className="flex items-center gap-2 shrink-0 select-none cursor-pointer">
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Custom ClipStake red-gradient play/flag logo */}
        <svg
          width={iconSize + 8}
          height={iconSize + 8}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <path
            d="M6 6L26 16L6 26V6Z"
            fill="url(#clipstake_logo_grad)"
          />
          <path
            d="M13 7L24 13L18 16L13 13V7Z"
            fill="#FFA3B1"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="clipstake_logo_grad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF1E56" />
              <stop offset="1" stopColor="#E11D48" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span
          className={`
            font-black tracking-tight text-text-primary bg-clip-text
            ${size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-3xl"}
          `}
          style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
        >
          CreatorX
        </span>
      )}
    </div>
  );
}
