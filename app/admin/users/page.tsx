"use client"

import { useEffect, useState } from "react"
import { Loader2, Users, Search } from "lucide-react"

interface SyckUser {
  discordId: string
  username: string
  firstSeenAt: string
  lastSeenAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SyckUser[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.discordId.includes(search)
  )

  return (
    <div>
      <div
        className="flex items-center justify-between mb-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        <div>
          <h1 className="font-display text-2xl">Users</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {users.length} registered users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[oklch(0.07_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm px-3 py-2 mb-6">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or Discord ID..."
          className="flex-1 bg-transparent text-sm font-mono focus:outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[oklch(0.18_0.008_260)] rounded-sm">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-mono text-sm">{search ? "No users match" : "No users yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user, i) => (
            <div
              key={user.discordId}
              className="flex items-center gap-4 bg-[oklch(0.09_0.008_260)] border border-[oklch(0.18_0.008_260)] rounded-sm p-4 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0, transitionDelay: `${i * 30}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-mono text-[#5865F2]">{user.username[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground font-mono">{user.discordId}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-muted-foreground">
                  Joined {new Date(user.firstSeenAt).toLocaleDateString()}
                </p>
                <p className="text-xs font-mono text-muted-foreground/60">
                  Last seen {new Date(user.lastSeenAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
