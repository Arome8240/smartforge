"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Grid3x3,
  Code,
  GitBranch,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contracts", href: "/dashboard/contracts", icon: FileText },
  { label: "Tables", href: "/dashboard/tables", icon: Grid3x3 },
  { label: "Structs", href: "/dashboard/contracts", icon: Code },
  { label: "Mappings", href: "/dashboard/mappings", icon: GitBranch },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile toggle */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col ${
          isOpen ? "w-64" : "w-0"
        } md:w-64 overflow-hidden`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b border-sidebar-border">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            SmartForge
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href; //|| pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground border border-sidebar-ring shadow-lg neon-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20 border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/20"
            asChild
          >
            <Link href="#logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content spacer */}
      <div className="hidden md:block md:w-64" />
    </>
  );
}
