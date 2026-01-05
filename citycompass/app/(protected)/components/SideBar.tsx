"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  BarChart3,
  ClipboardList,
  FileText,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Map", href: "/map", icon: Map },
  { name: "Compare", href: "/compare", icon: BarChart3 },
  { name: "Survey", href: "/survey", icon: ClipboardList },
];

export default function SideBar() {
  const pathname = usePathname();

  function logoutUser() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <aside className="fixed left-0 top-0 z-20 h-full w-60 bg-sidebar border-r border-sidebar-border flex flex-col justify-between text-sidebar-foreground">
      {/* Logo */}
      <div>
        <div className="p-6 font-semibold text-lg text-sidebar-primary">
          CityCompass
          <div className="text-xs text-muted-foreground font-normal">
            NY Insights
          </div>
        </div>

        {/* Nav Items */}
        <nav className="mt-3 space-y-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={name} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5 mx-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-muted hover:text-sidebar-primary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Language */}
      <div className="p-4 text-xs flex justify-between items-center border-t border-sidebar-border text-muted-foreground">
        <span>🌐 EN</span>
        <Button onClick={logoutUser} className="btn-primary">
          Logout
        </Button>
      </div>
    </aside>
  );
}
