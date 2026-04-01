"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingBag, LayoutDashboard, ShieldCheck, LogOut, ChevronDown } from "lucide-react"

export function SiteNav() {
  const { data: session, status } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-dropdown]")) setIsDropdownOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Client-side admin check via NEXT_PUBLIC_OWNER_IDS
  const adminIds = (process.env.NEXT_PUBLIC_OWNER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const isAdminUser = session?.user?.discordId
    ? adminIds.includes(session.user.discordId)
    : false

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? "top-4 left-4 right-4" : "top-0 left-0 right-0"
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileOpen
            ? "bg-[oklch(0.06_0.008_260)]/90 backdrop-blur-xl border border-[oklch(0.18_0.008_260)] rounded-2xl shadow-lg max-w-[1200px]"
            : "bg-[oklch(0.06_0.008_260)]/70 backdrop-blur-sm max-w-[1400px]"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? "h-14" : "h-16"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-xl tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
              SYCK
            </span>
            <span className="font-mono text-[10px] mt-0.5 text-muted-foreground">STORE</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/store"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors relative group"
            >
              Store
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
            {session && (
              <Link
                href="/purchases"
                className="text-sm text-foreground/70 hover:text-foreground transition-colors relative group"
              >
                My Purchases
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
              </Link>
            )}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-[oklch(0.12_0.008_260)] animate-pulse" />
            ) : session ? (
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[oklch(0.12_0.008_260)] transition-colors"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[oklch(0.18_0.008_260)] flex items-center justify-center text-xs font-mono">
                      {(session.user?.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-foreground/80">{session.user?.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-lg overflow-hidden shadow-xl">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-[oklch(0.12_0.008_260)] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      My Dashboard
                    </Link>
                    <Link
                      href="/purchases"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-[oklch(0.12_0.008_260)] transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      My Purchases
                    </Link>
                    {isAdminUser && (
                      <Link
                        href="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#eca8d6] hover:bg-[oklch(0.12_0.008_260)] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-[oklch(0.18_0.008_260)]" />
                    <button
                      onClick={() => { setIsDropdownOpen(false); signOut() }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-[oklch(0.12_0.008_260)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.114 18.105.132 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                Sign in with Discord
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-[oklch(0.06_0.008_260)] z-40 transition-all duration-500 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-24 pb-8">
          <div className="flex-1 flex flex-col gap-6">
            <Link
              href="/store"
              onClick={() => setIsMobileOpen(false)}
              className="text-3xl font-display text-foreground hover:text-muted-foreground transition-colors"
            >
              Store
            </Link>
            {session && (
              <>
                <Link
                  href="/purchases"
                  onClick={() => setIsMobileOpen(false)}
                  className="text-3xl font-display text-foreground hover:text-muted-foreground transition-colors"
                >
                  Purchases
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="text-3xl font-display text-foreground hover:text-muted-foreground transition-colors"
                >
                  Dashboard
                </Link>
                {isAdminUser && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-3xl font-display text-[#eca8d6] hover:opacity-80 transition-opacity"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="pt-8 border-t border-[oklch(0.18_0.008_260)]">
            {session ? (
              <div className="flex items-center gap-4">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors"
              >
                Sign in with Discord
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
