"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { EllipsisVertical, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { amenityTypeLabel, Booking, upcomingBookings } from "@/lib/resident-data"

type BookingFilter = "all" | "upcoming" | "today" | "week"

const statusClass: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-emerald-100 text-emerald-700",
  no_show: "bg-red-100 text-red-700",
}

export default function MyBookingsPage() {
  const [filter, setFilter] = useState<BookingFilter>("all")
  const [bookings, setBookings] = useState<Booking[]>(upcomingBookings)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [viewMode, setViewMode] = useState<"details" | "cancel" | "reschedule" | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    const now = new Date()

    return bookings.filter((booking) => {
      const date = parseISO(`${booking.date}T00:00:00`)

      if (filter === "today") {
        return format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
      }

      if (filter === "week") {
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
      }

      if (filter === "upcoming") {
        return booking.status === "confirmed" || booking.status === "pending"
      }

      return true
    })
  }, [bookings, filter])

  const onRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 600)
  }

  const cancelBooking = () => {
    if (!selectedBooking) {
      return
    }

    setBookings((prev) => prev.map((entry) => (entry.id === selectedBooking.id ? { ...entry, status: "cancelled" } : entry)))
    toast.success("Booking cancelled")
    setViewMode(null)
    setSelectedBooking(null)
  }

  const rescheduleBooking = () => {
    if (!selectedBooking) {
      return
    }

    setBookings((prev) =>
      prev.map((entry) =>
        entry.id === selectedBooking.id
          ? {
              ...entry,
              date: format(new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), "yyyy-MM-dd"),
              startTime: "16:00",
              endTime: "17:00",
            }
          : entry,
      ),
    )
    toast.success("Booking rescheduled")
    setViewMode(null)
    setSelectedBooking(null)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>My Bookings</CardTitle>
            <p className="text-sm text-slate-600">Your upcoming reservations</p>
          </div>
          <Button variant="outline" size="icon" className="bg-transparent" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["upcoming", "Upcoming"],
              ["today", "Today"],
              ["week", "This Week"],
            ] as const).map(([value, label]) => (
              <Button key={value} variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} className="min-h-11">
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            <h3 className="text-lg font-semibold">No upcoming bookings</h3>
            <p className="text-sm text-slate-600">You do not have any bookings yet. Browse amenities to book one.</p>
            <Button asChild>
              <Link href="/resident/amenities">Browse Amenities</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Card key={booking.id} className="border-l-4 border-l-emerald-300">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{booking.amenityName}</h3>
                      <Badge>{amenityTypeLabel[booking.amenityType]}</Badge>
                      <Badge className={statusClass[booking.status]}>{booking.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{format(parseISO(`${booking.date}T00:00:00`), "EEEE, MMM d")}</p>
                    <p className="text-sm text-slate-600">{booking.startTime} - {booking.endTime}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="min-h-11 bg-transparent" onClick={() => toast.success("Calendar export generated")}>Add to Calendar</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-transparent">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBooking(booking)
                            setViewMode("details")
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBooking(booking)
                            setViewMode("reschedule")
                          }}
                        >
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setViewMode("cancel")
                          }}
                        >
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-4 py-3 text-sm text-slate-500">
                Booking ID: {booking.id}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewMode !== null} onOpenChange={(open) => !open && setViewMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewMode === "details" ? "Booking details" : viewMode === "cancel" ? "Cancel booking" : "Reschedule booking"}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking
                ? `${selectedBooking.amenityName} on ${format(parseISO(`${selectedBooking.date}T00:00:00`), "MMM d")}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {viewMode === "details" && selectedBooking && (
            <div className="space-y-1 text-sm">
              <p>Amenity: {selectedBooking.amenityName}</p>
              <p>Date: {selectedBooking.date}</p>
              <p>Time: {selectedBooking.startTime} - {selectedBooking.endTime}</p>
              <p>Status: {selectedBooking.status.toUpperCase()}</p>
              <p>Cancellation policy: Allowed up to 24 hours before booking time.</p>
            </div>
          )}

          {viewMode === "cancel" && (
            <p className="text-sm text-slate-700">You can cancel up to 24 hours before the booking time.</p>
          )}

          {viewMode === "reschedule" && (
            <p className="text-sm text-slate-700">This demo will move your booking to an available slot two days later.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMode(null)}>
              {viewMode === "cancel" ? "Keep Booking" : "Close"}
            </Button>
            {viewMode === "cancel" ? <Button variant="destructive" onClick={cancelBooking}>Cancel Booking</Button> : null}
            {viewMode === "reschedule" ? <Button onClick={rescheduleBooking}>Update Booking</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
