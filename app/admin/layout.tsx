"use client"

import { useSession } from "next-auth/react"
import { SiteNav } from "@/components/shared/site-nav"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck, CreditCard, Tag, LayoutDashboard, Loader2, Users, Star, TrendingUp, Package } from "lucide-react"

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/paypal", label: "PayPal Queue", icon: CreditCard },
  { href: "/admin/sales", label: "All Sales", icon: TrendingUp },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const ownerIds = (process.env.NEXT_PUBLIC_OWNER_IDS ?? "").split(",").map(s => s.trim())
  const isAdmin = session?.user?.discordId ? ownerIds.includes(session.user.discordId) : false

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center">
        <SiteNav />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.008_260)] noise-overlay">
        <SiteNav />
        <div className="pt-32 flex flex-col items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-5 h-5 text-destructive" />
            </div>
            <h1 className="font-display text-2xl mb-3">Access Denied</h1>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to access the admin panel.
            </p>
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
            <p className="font-mono text-[10px] text-[#eca8d6] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </p>
            <nav className="flex flex-col gap-1">
              {adminLinks.map(link => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-mono transition-all ${
                      active
                        ? "bg-[#eca8d6]/10 text-[#eca8d6] border border-[#eca8d6]/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.09_0.008_260)]"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[oklch(0.06_0.008_260)] border-t border-[oklch(0.14_0.008_260)] flex overflow-x-auto">
        {adminLinks.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 min-w-[60px] flex flex-col items-center justify-center gap-1 py-3 text-[9px] font-mono transition-colors ${
                active ? "text-[#eca8d6]" : "text-muted-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
