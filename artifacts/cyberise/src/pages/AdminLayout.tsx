import { Link, useRoute } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import {
  Users,
  Server,
  Settings,
  Shield,
  ArrowLeft,
  Code2,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/orders", icon: Server, label: "Orders" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/dev", icon: Code2, label: "Dev" },
];

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const [isUsers] = useRoute("/admin/users");
  const [isOrders] = useRoute("/admin/orders");
  const [isSettings] = useRoute("/admin/settings");
  const [isDev] = useRoute("/admin/dev");

  const active = isUsers
    ? "/admin/users"
    : isOrders
      ? "/admin/orders"
      : isSettings
        ? "/admin/settings"
        : isDev
          ? "/admin/dev"
          : "/admin/users";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a1a2e]">
      <div className="flex">
        <aside className="w-64 min-h-screen border-r border-[#ffffff0a] bg-[#0a0a0f]/50 backdrop-blur-sm p-4 hidden lg:block">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#a0a0b8] hover:text-white transition-colors text-sm mb-4"
            >
              <ArrowLeft className="w-3 h-3" /> Back to site
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#7b2ff7] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Admin Panel</p>
                <p className="text-[#a0a0b8] text-xs">Cyberise RDP</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active === item.href
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20"
                    : "text-[#a0a0b8] hover:text-white hover:bg-[#ffffff05]",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="lg:hidden w-full px-4 py-3 border-b border-[#ffffff0a] bg-[#0a0a0f]">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Link href="/" className="text-[#a0a0b8] hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all",
                  active === item.href
                    ? "bg-[#00f0ff]/10 text-[#00f0ff]"
                    : "text-[#a0a0b8]",
                )}
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 pt-4 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ProtectedRoute>
  );
}
