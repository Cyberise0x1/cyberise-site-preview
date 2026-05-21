import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Menu,
  Zap,
} from "lucide-react";
import { useApi, type Order } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/market", label: "Marketplace", Icon: ShoppingCart },
  { href: "/orders", label: "My Orders", Icon: Receipt },
];

export default function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { api } = useApi();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!isSignedIn) return;
    api<{ success: boolean; data: Order[] }>("/orders")
      .then((r) =>
        setActiveCount(r.data.filter((o) => o.status === "ACTIVE").length),
      )
      .catch(() => {});
  }, [isSignedIn]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-[#0d0d14] border-r border-[rgba(0,240,255,0.08)] z-30">
        <SidebarContent
          location={location}
          activeCount={activeCount}
          user={user}
          isSignedIn={isSignedIn}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 h-full w-[240px] bg-[#0d0d14] border-r border-[rgba(0,240,255,0.08)] z-50 flex flex-col lg:hidden"
            >
              <SidebarContent
                location={location}
                activeCount={activeCount}
                user={user}
                isSignedIn={isSignedIn}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[rgba(0,240,255,0.08)] bg-[#0d0d14] sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-[#a0a0b8] hover:text-white transition-colors p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-orbitron text-sm font-bold tracking-[2px] text-white uppercase">
            Cyberise
          </span>
          {isSignedIn && (
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          )}
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  location,
  activeCount,
  user,
  isSignedIn,
}: {
  location: string;
  activeCount: number;
  user: ReturnType<typeof useUser>["user"];
  isSignedIn: boolean | undefined;
}) {
  return (
    <>
      <div className="px-5 py-6 border-b border-[rgba(0,240,255,0.06)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#7b2ff7] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-orbitron text-[0.8rem] font-bold tracking-[2px] text-white uppercase leading-none">
              Cyberise
            </div>
            <div className="text-[0.6rem] text-[#a0a0b8] tracking-[1.5px] uppercase mt-0.5">
              Technology
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                  active
                    ? "bg-[rgba(0,240,255,0.08)] text-white border border-[rgba(0,240,255,0.15)]"
                    : "text-[#a0a0b8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#00f0ff]" : "text-[#666] group-hover:text-[#a0a0b8]"}`}
                />
                <span className="font-rajdhani tracking-[0.5px]">{label}</span>
                {label === "My Orders" && activeCount > 0 && (
                  <span className="ml-auto bg-[#00f0ff]/15 text-[#00f0ff] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#00f0ff]/25 leading-none">
                    {activeCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[rgba(0,240,255,0.06)] space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
          <span className="text-[#a0a0b8] text-[0.7rem] tracking-[1px] uppercase font-rajdhani">
            {activeCount} Active Instance{activeCount !== 1 ? "s" : ""}
          </span>
        </div>
        {isSignedIn && (
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard:
                    "bg-[#12121a] border border-[rgba(0,240,255,0.15)]",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.firstName || "User"}
              </p>
              <p className="text-[#666] text-[10px] truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
