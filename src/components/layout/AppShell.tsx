import { useState } from "react";
import type { ReactNode } from "react";
import type { UserRole } from "../../types";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "../ui/CommandPalette";

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="cx-product-shell relative min-h-screen overflow-x-hidden text-text-primary antialiased transition-colors duration-700">
      <div aria-hidden="true" className="cx-product-ambient pointer-events-none fixed inset-0" />
      <div className="cx-product-frame relative m-2 flex min-h-[calc(100vh-1rem)] overflow-hidden sm:m-4 sm:min-h-[calc(100vh-2rem)]">
        <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-out">
          <Topbar role={role} collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
          <main className="cx-role-workspace mx-auto w-full max-w-[1600px] flex-1 px-4 pb-24 pt-7 sm:px-7 lg:px-10">
            <div className="animate-fadeIn [animation-duration:500ms]">{children}</div>
          </main>
        </div>
      </div>
      <MobileNavigation role={role} />
      <CommandPalette />
    </div>
  );
}
