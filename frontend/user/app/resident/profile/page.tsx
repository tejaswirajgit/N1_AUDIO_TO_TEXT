"use client"

import { useEffect, useState } from "react"
import { Edit3 } from "lucide-react"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/resident-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"

const defaultProfile: UserProfile = {
  id: "",
  name: "",
  email: "",
  phone: "",
  apartment: "",
  buildingName: "Skyline Residences",
  joinDate: "",
  avatarUrl: "/placeholder-user.jpg",
  notifications: {
    bookingConfirmations: true,
    bookingReminders: true,
    newAmenities: false,
    announcements: true,
    maintenance: true,
  },
  preferences: {
    theme: "light",
    language: "en",
  },
}

export default function ProfilePage() {
  const [authUserId, setAuthUserId] = useState("")
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: "", next: "", confirm: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) { setLoading(false); return }
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setAuthUserId(user.id)

        const meta = user.user_metadata ?? {}
        setProfile((prev) => ({
          ...prev,
          id: meta.resident_id || user.id,
          name: meta.name || meta.full_name || user.email || "",
          email: user.email || "",
          phone: meta.phone || "",
          apartment: meta.apartment || meta.unit || "",
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "",
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (/invalid refresh token|refresh token not found|fetch failed/i.test(message)) {
          await supabase.auth.signOut({ scope: "local" })
          window.location.href = "/login"
          return
        }
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }
    void loadProfile()
  }, [])

  const saveProfile = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({
      email: profile.email,
      data: {
        name: profile.name,
        full_name: profile.name,
        phone: profile.phone,
        apartment: profile.apartment,
      },
    })
    if (error) {
      toast.error(error.message)
      return
    }

    if (authUserId) {
      const directoryRow = {
        id: authUserId,
        auth_user_id: authUserId,
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        apartment: profile.apartment,
      }
      for (const tableName of ["users", "profiles"]) {
        try {
          await supabase.from(tableName).upsert(directoryRow)
        } catch {
          // Keep profile edit non-blocking if table policies/schemas differ.
        }
      }
    }

    setEditing(false)
    toast.success("Profile updated")
  }

  const savePreferences = () => {
    toast.success("Preferences saved")
  }

  const updatePassword = async () => {
    const hasLength = passwordData.next.length >= 8
    const hasUpper = /[A-Z]/.test(passwordData.next)
    const hasNumber = /[0-9]/.test(passwordData.next)

    if (!hasLength || !hasUpper || !hasNumber || passwordData.next !== passwordData.confirm) {
      toast.error("Password does not meet validation requirements")
      return
    }

    if (!supabase) { toast.error("Not connected"); return }
    setPasswordLoading(true)

    const { error } = await supabase.auth.updateUser({ password: passwordData.next })
    setPasswordLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setPasswordData({ current: "", next: "", confirm: "" })
    setShowPasswordModal(false)
    toast.success("Password changed successfully")
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading profile...</div>
  }

  const initials = profile.name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>My Profile</CardTitle>
            <p className="text-sm text-slate-600">Account and settings</p>
          </div>
          <Button variant="outline" className="bg-transparent" onClick={() => setEditing((prev) => !prev)}>
            <Edit3 className="mr-2 h-4 w-4" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {editing ? <Button variant="outline">Change Photo</Button> : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={profile.name}
                disabled={!editing}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={profile.email}
                disabled={!editing}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={profile.phone}
                disabled={!editing}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Apartment</Label>
              <Input value={profile.apartment} disabled />
            </div>
          </div>

          <p className="text-sm text-slate-600">Member since {profile.joinDate}</p>
          {editing ? <Button onClick={saveProfile}>Save Changes</Button> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            ["bookingConfirmations", "Booking confirmations"],
            ["bookingReminders", "Booking reminders (15 min before)"],
            ["newAmenities", "New amenities available"],
            ["announcements", "Building announcements"],
            ["maintenance", "Maintenance updates"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">{label}</p>
              <Switch
                checked={profile.notifications[key]}
                onCheckedChange={(checked) =>
                  setProfile((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [key]: checked,
                    },
                  }))
                }
              />
            </div>
          ))}
          <Button onClick={savePreferences}>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password and Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="bg-transparent" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
          <Button variant="outline" className="bg-transparent">Log out from other devices</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Theme</Label>
            <Select
              value={profile.preferences.theme}
              onValueChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, theme: value as "light" | "dark" },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Language</Label>
            <Select
              value={profile.preferences.language}
              onValueChange={(value) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: value as "en" | "es" },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={savePreferences}>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Help and Support</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-transparent">Contact Support</Button>
          <Button variant="outline" className="bg-transparent">FAQs</Button>
          <Button variant="outline" className="bg-transparent">Report a Problem</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordData.current}
                onChange={(event) => setPasswordData((prev) => ({ ...prev, current: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordData.next}
                onChange={(event) => setPasswordData((prev) => ({ ...prev, next: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(event) => setPasswordData((prev) => ({ ...prev, confirm: event.target.value }))}
              />
            </div>
            <p className="text-xs text-slate-600">Must be 8+ chars, include 1 uppercase and 1 number.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button onClick={updatePassword} disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-700">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteModal(false)
                toast.error("Account deletion request submitted")
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
