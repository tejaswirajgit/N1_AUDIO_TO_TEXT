"use client"

import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { Booking, bookingHistory } from "@/lib/resident-data"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_SIZE = 10

const statusClass: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-200 text-slate-700",
  completed: "bg-emerald-100 text-emerald-700",
  no_show: "bg-red-100 text-red-700",
}

export default function BookingHistoryPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const filtered = useMemo(() => {
    let result = [...bookingHistory]

    if (search.trim()) {
      result = result.filter((item) => item.amenityName.toLowerCase().includes(search.trim().toLowerCase()))
    }

    if (status !== "all") {
      result = result.filter((item) => item.status === status)
    }

    if (fromDate) {
      result = result.filter((item) => item.date >= fromDate)
    }

    if (toDate) {
      result = result.filter((item) => item.date <= toDate)
    }

    result.sort((a, b) => {
      const first = parseISO(`${a.date}T00:00:00`).getTime()
      const second = parseISO(`${b.date}T00:00:00`).getTime()
      return sortOrder === "newest" ? second - first : first - second
    })

    return result
  }, [fromDate, search, sortOrder, status, toDate])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const applyFilter = () => {
    setLoading(true)
    setPage(1)
    setTimeout(() => setLoading(false), 400)
  }

  const reset = () => {
    setSearch("")
    setStatus("all")
    setFromDate("")
    setToDate("")
    setSortOrder("newest")
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
          <p className="text-sm text-slate-600">Your past reservations</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by amenity name..." className="h-11" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sort</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilter}>Apply Filter</Button>
            <Button variant="outline" onClick={reset} className="bg-transparent">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : currentRows.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold">No booking history</h3>
              <p className="text-sm text-slate-600">You have not completed any bookings yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Amenity</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3">{row.amenityName}</td>
                      <td className="px-4 py-3">{format(parseISO(`${row.date}T00:00:00`), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">{row.startTime}-{row.endTime}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusClass[row.status]}>{row.status.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button className="font-medium text-blue-600" onClick={() => setSelectedBooking(row)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
          Previous
        </Button>
        <p className="text-sm text-slate-600">
          Page {page} of {pageCount}
        </p>
        <Button variant="outline" onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={page === pageCount}>
          Next
        </Button>
      </div>

      <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-1 text-sm">
              <p>Amenity: {selectedBooking.amenityName}</p>
              <p>Date: {selectedBooking.date}</p>
              <p>Time: {selectedBooking.startTime}-{selectedBooking.endTime}</p>
              <p>Status: {selectedBooking.status.toUpperCase()}</p>
              <p>Booking ID: {selectedBooking.id}</p>
              <p>Booked On: {format(parseISO(selectedBooking.createdAt), "MMM d, yyyy")}</p>
              {selectedBooking.cancelledAt ? <p>Cancelled On: {format(parseISO(selectedBooking.cancelledAt), "MMM d, yyyy")}</p> : null}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
