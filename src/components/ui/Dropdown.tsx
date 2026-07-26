import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = "left",
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {trigger}
        <Icon
          name="chevron-down"
          size={14}
          className="text-text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div
          className={`
            absolute z-40 mt-2 min-w-[180px] glass-strong border border-border-strong
            rounded-xl shadow-[var(--shadow-xl),var(--shadow-drop-3d),inset_0_1px_1px_var(--color-bezel)] py-1.5 overflow-hidden
            ${align === "right" ? "right-0" : "left-0"}
          `}
          role="listbox"
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                onSelect(item.value);
                setOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors
                ${item.danger ? "text-danger hover:bg-danger-subtle" : "text-text-primary hover:bg-surface-hover"}
              `}
              role="option"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}