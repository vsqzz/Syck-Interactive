"use client"

import { useSession, signIn } from "next-auth/react"
import { SiteNav } from "@/components/shared/site-nav"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, TrendingUp, Settings, Loader2, Plus
} from "lucide-react"

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/sales", label: "Sales", icon: TrendingUp },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center">
        <SiteNav />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
        <SiteNav />
        <div className="pt-32 flex flex-col items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h1 className="font-display text-2xl mb-3">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in with Discord to access your seller dashboard.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono text-sm rounded-sm transition-colors"
            >
              Sign in with Discord
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
      <SiteNav />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-28 md:pb-24 flex gap-8">
        {/* Sidebar — desktop only */}
        <aside className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-28">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
              Seller
            </p>
            <nav className="flex flex-col gap-1 mb-6">
              {sidebarLinks.map(link => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-mono transition-all ${
                      active
                        ? "bg-[oklch(0.14_0.008_260)] text-foreground border border-[oklch(0.28_0.008_260)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.09_0.008_260)]"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-2 px-3 py-2 bg-[#eca8d6]/10 border border-[#eca8d6]/30 text-[#eca8d6] text-sm font-mono rounded-sm hover:bg-[#eca8d6]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Product
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[oklch(0.06_0.008_260)] border-t border-[oklch(0.14_0.008_260)] flex">
        {sidebarLinks.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-mono transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          )
        })}
        <Link
          href="/dashboard/products/new"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-mono text-[#eca8d6]"
        >
          <Plus className="w-5 h-5" />
          New
        </Link>
      </nav>
    </div>
  )
}
