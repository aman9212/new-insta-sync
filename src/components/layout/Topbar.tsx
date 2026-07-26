import { Avatar } from "../ui/Avatar";
import { Dropdown } from "../ui/Dropdown";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";
import { NotificationBell } from "../ui/NotificationBell";
import type { UserRole } from "../../types";
import { useAuthContext } from "../../app/providers";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";
import { useWallet } from "../../hooks/useWallet";

interface TopbarProps {
  role: UserRole;
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ role, collapsed, onToggleSidebar }: TopbarProps) {
  const { profile, user, signOut } = useAuthContext();
  const { wallet } = useWallet();
  const displayName = profile?.display_name ?? user?.email ?? "CreatorX user";
  const email = profile?.email ?? user?.email ?? "";
  const balance = wallet ? (wallet.available_balance_cents / 100).toFixed(2) : "0.00";

  return (
    <header className="cx-product-topbar sticky top-4 z-30 mx-2 mt-2 h-14 rounded-full border border-white/10 bg-surface/80 backdrop-blur-2xl flex items-center justify-between px-5 shrink-0 shadow-2xl shadow-black/40 transition-colors duration-500 sm:mx-4 sm:mt-4">
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="md:hidden">
          <Logo size="sm" />
        </div>

        {/* Sidebar toggle - desktop */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200 active:scale-95"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={18} />
        </button>

        {/* Mobile menu */}
        <button
          className="md:hidden p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all duration-200 active:scale-95"
          aria-label="Open menu"
        >
          <Icon name="menu" size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* USDC Balance Pill */}
        <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 cursor-pointer transition-all duration-200 shadow-md select-none active:scale-[0.98]">
          <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-black select-none">
            $
          </div>
          <span>${balance}</span>
          <Icon name="chevron-down" size={12} className="text-accent/80" />
        </div>

        <ThemeSwitcher />
        
        <NotificationBell />

        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 pl-2 cursor-pointer">
              <Avatar src={profile?.avatar_url ?? null} fallback={displayName} size="sm" />
              <div className="hidden sm:flex flex-col text-xs leading-tight">
                <span className="font-semibold text-text-primary">{displayName}</span>
                <span className="text-[10px] text-accent uppercase font-bold tracking-wider">{role}</span>
              </div>
            </div>
          }
          items={[
            {
              label: email,
              value: "email",
              icon: <span className="text-xs text-text-muted">{email}</span>,
            },
            {
              label: "Sign out",
              value: "logout",
              danger: true,
            },
          ]}
          onSelect={(value) => {
            if (value === "logout") void signOut();
          }}
          align="right"
        />
      </div>
    </header>
  );
}
