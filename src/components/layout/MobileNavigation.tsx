import { NavLink } from "react-router-dom";
import { Icon } from "../ui/Icon";
import type { UserRole } from "../../types";

const items: Record<UserRole, Array<{ to: string; label: string; iconName: string }>> = {
  creator: [
    { to: "/creator/dashboard", label: "Home", iconName: "layout-dashboard" },
    { to: "/creator/explore", label: "Explore", iconName: "compass" },
    { to: "/creator/submissions", label: "Posts", iconName: "file-text" },
    { to: "/creator/wallet", label: "Wallet", iconName: "wallet" },
  ],
  brand: [
    { to: "/brand/dashboard", label: "Home", iconName: "layout-dashboard" },
    { to: "/brand/campaigns", label: "Campaigns", iconName: "briefcase" },
    { to: "/brand/submissions", label: "Posts", iconName: "file-text" },
    { to: "/brand/settings", label: "Settings", iconName: "bar-chart" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Home", iconName: "layout-dashboard" },
    { to: "/admin/users", label: "Users", iconName: "users" },
    { to: "/admin/campaigns", label: "Campaigns", iconName: "briefcase" },
    { to: "/admin/withdrawals", label: "Payouts", iconName: "wallet" },
  ],
};

export function MobileNavigation({ role }: { role: UserRole }) {
  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border
        bg-bg/95 px-2 py-2 backdrop-blur-xl md:hidden
      "
    >
      {items[role].map((item) => {
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: { isActive: boolean }) =>
              `
                flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px]
                transition-colors duration-200
                ${isActive ? "text-accent" : "text-text-muted"}
              `
            }
          >
            <Icon name={item.iconName} size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
