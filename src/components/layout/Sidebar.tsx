import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { Icon } from "../ui/Icon";
import type { UserRole } from "../../types";

interface NavItem {
  to: string;
  label: string;
  iconName: string;
  end?: boolean;
}

const creatorNav: NavItem[] = [
  { to: "/creator/dashboard", label: "Dashboard", iconName: "layout-dashboard", end: true },
  { to: "/creator/explore", label: "Explore Campaigns", iconName: "compass" },
  { to: "/creator/submissions", label: "My Submissions", iconName: "file-text" },
  { to: "/creator/analytics", label: "Analytics", iconName: "trending-up" },
  { to: "/creator/accounts", label: "Linked Accounts", iconName: "link" },
  { to: "/creator/wallet", label: "Wallet", iconName: "wallet" },
  { to: "/creator/settings", label: "Settings", iconName: "settings" },
];

const brandNav: NavItem[] = [
  { to: "/brand/dashboard", label: "Dashboard", iconName: "layout-dashboard", end: true },
  { to: "/brand/campaigns", label: "Campaigns", iconName: "briefcase" },
  { to: "/brand/campaigns/new", label: "Create Campaign", iconName: "plus-circle" },
  { to: "/brand/submissions", label: "Submissions", iconName: "file-stack" },
  { to: "/brand/intelligence", label: "Creator Intelligence", iconName: "eye" },
  { to: "/brand/analytics", label: "Analytics", iconName: "bar-chart" },
  { to: "/brand/payouts", label: "Payout Overview", iconName: "dollar-sign" },
  { to: "/brand/settings", label: "Settings", iconName: "settings" },
];

const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", iconName: "layout-dashboard", end: true },
  { to: "/admin/appearance", label: "Appearance", iconName: "palette" },
  { to: "/admin/website-builder", label: "Website Builder", iconName: "layout" },
  { to: "/admin/campaigns", label: "Campaign Management", iconName: "briefcase" },
  { to: "/admin/submissions", label: "Submission Review", iconName: "file-stack" },
  { to: "/admin/fraud-review", label: "Fraud Review", iconName: "shield-alert" },
  { to: "/admin/withdrawals", label: "Payouts", iconName: "download" },
  { to: "/admin/creators", label: "Creators Management", iconName: "users" },
  { to: "/admin/users", label: "Users & Accounts", iconName: "user-check" },
  { to: "/admin/brands", label: "Brands", iconName: "bar-chart" },
  { to: "/admin/audit-logs", label: "Audit Logs", iconName: "scroll" },
  { to: "/admin/finance", label: "Finance Center", iconName: "wallet" },
  { to: "/admin/integrations", label: "Integrations Platform", iconName: "plug-zap" },
  { to: "/admin/settings", label: "System Settings", iconName: "sliders" },
];

const navByRole: Record<UserRole, NavItem[]> = {
  creator: creatorNav,
  brand: brandNav,
  admin: adminNav,
};

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, collapsed }: SidebarProps) {
  const items = navByRole[role];

  return (
    <aside
      className={`
        cx-product-sidebar h-[calc(100vh-48px)] sticky top-6 my-2 ml-2 rounded-[30px] bg-surface/75 backdrop-blur-2xl border border-white/10
        flex flex-col shrink-0 transition-all duration-500 ease-out overflow-hidden shadow-2xl shadow-black/40 sm:my-4 sm:ml-4
        ${collapsed ? "w-[68px]" : "w-[240px]"}
        max-md:hidden
      `}
    >
      {/* Logo area */}
      <div className={`px-4 py-5 border-b border-border/50 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? <Logo size="sm" showText={false} /> : <Logo size="md" showText />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }: { isActive: boolean }) =>
              `
              flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold
              transition-all duration-200 ease-out
              ${collapsed ? "justify-center px-2" : ""}
              ${
                isActive
                  ? "cx-nav-active bg-accent text-white shadow-lg shadow-accent/25 font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/80"
              }
              active:scale-[0.98]
            `
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">
              <Icon name={item.iconName} size={18} />
            </span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border/50 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          CreatorX · $500M SaaS Platform
        </div>
      )}
    </aside>
  );
}
