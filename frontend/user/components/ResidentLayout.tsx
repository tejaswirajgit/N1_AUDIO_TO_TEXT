"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, CalendarDays, Clock3, Home, LogOut, Settings, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

const navItems = [
  { href: "/resident/amenities", label: "Amenities", icon: Home },
  { href: "/resident/my-bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/resident/booking-history", label: "History", icon: Clock3 },
  { href: "/resident/profile", label: "Profile", icon: UserRound },
]

const pageTitles: Record<string, string> = {
  "/resident/amenities": "Discover",
  "/resident/my-bookings": "My Bookings",
  "/resident/booking-history": "Booking History",
  "/resident/profile": "My Profile",
}

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const meta = user.user_metadata ?? {}
        const name = meta.name || meta.full_name || user.email || ""
        setUserName(name)
        const parts = name.trim().split(/\s+/)
        setUserInitials(parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase())
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (/invalid refresh token|refresh token not found|fetch failed/i.test(message)) {
          await supabase.auth.signOut({ scope: "local" })
          router.push("/login")
          return
        }
        console.error("Failed to load resident user:", error)
      }
    }
    void loadUser()
  }, [])

  const title = pageTitles[pathname] ?? (pathname.includes("/resident/amenities/") ? "Amenity Details" : "Resident")

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="border-b px-5 py-4">
          <Link href="/resident/amenities" className="text-lg font-semibold text-slate-900">
            Skyline Residences
          </Link>
          <p className="mt-1 text-xs text-slate-500">Resident Portal</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100",
                pathname === item.href && "bg-blue-50 text-blue-700",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div>
              <p className="text-sm text-slate-500">Skyline Residences</p>
              <h1 className="text-base font-semibold text-slate-900">{title}</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" aria-label="notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" alt={userName} />
                      <AvatarFallback>{userInitials || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium md:inline">{userName || "Loading..."}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => router.push("/resident/profile")}>My Profile</DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>Help / Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    try {
                      if (supabase) {
                        await supabase.auth.signOut()
                      }
                      // Use window.location for hard redirect after logout
                      window.location.href = "/login"
                    } catch (error) {
                      console.error('Logout error:', error)
                      // Force redirect even if signOut fails
                      window.location.href = "/login"
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 sm:p-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white md:hidden">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-slate-500",
                pathname === item.href && "text-blue-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
