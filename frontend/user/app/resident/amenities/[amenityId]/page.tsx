"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { addDays, format, isBefore, startOfDay } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, CalendarDays, Clock3, Users } from "lucide-react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { generateAvailabilitySlots, getAmenityById } from "@/lib/resident-data"

const durationOptions = [30, 60, 90, 120]

export default function AmenityDetailPage() {
  const params = useParams<{ amenityId: string }>()
  const router = useRouter()

  const amenityId = Array.isArray(params?.amenityId) ? params.amenityId[0] : params?.amenityId
  const amenity = amenityId ? getAmenityById(amenityId) : undefined

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [duration, setDuration] = useState("60")
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const slots = useMemo(() => {
    if (!amenity) {
      return []
    }
    return generateAvailabilitySlots(amenity, selectedDate)
  }, [amenity, selectedDate])

  const selectedSlotData = slots.find((slot) => `${slot.startTime}-${slot.endTime}` === selectedSlot)

  const disabledDays = {
    before: startOfDay(new Date()),
    after: amenity ? addDays(new Date(), amenity.rules.advanceBookingDays) : addDays(new Date(), 7),
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      return
    }

    if (isBefore(startOfDay(date), startOfDay(new Date()))) {
      return
    }

    setSelectedDate(date)
    setSelectedSlot("")
    setErrorMessage("")
    setIsLoadingSlots(true)
    setTimeout(() => setIsLoadingSlots(false), 400)
  }

  const handleConfirmBooking = async () => {
    if (!amenity || !selectedSlotData) {
      setErrorMessage("Please select an available time slot.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    await new Promise((resolve) => setTimeout(resolve, 900))

    const capacityError = selectedSlotData.remainingCapacity <= 1
    if (capacityError) {
      setErrorMessage("Sorry, this slot is now full. Please choose another time.")
      setIsSubmitting(false)
      return
    }

    toast.success(`Booking confirmed! See you on ${format(selectedDate, "MMM d")} at ${selectedSlotData.startTime}`)
    setIsSubmitting(false)
    setIsBookingModalOpen(false)
    router.push("/resident/my-bookings")
  }

  if (!amenityId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-600">Invalid amenity route.</CardContent>
      </Card>
    )
  }

  if (!amenity) {
    return (
      <Card>
        <CardContent className="space-y-2 p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="font-medium">Amenity not found.</p>
          <Button onClick={() => router.push("/resident/amenities")}>Back to amenities</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" className="min-h-11" onClick={() => router.push("/resident/amenities")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Amenities
      </Button>

      <Card className="overflow-hidden">
        <div className="relative h-56 w-full">
          <Image src={amenity.imageUrl} alt={amenity.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl font-semibold">{amenity.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <Badge className="bg-white text-slate-900">{amenity.type.toUpperCase()}</Badge>
              <span>{amenity.rating} stars ({amenity.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Amenity Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>{amenity.description}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <p className="rounded-md bg-slate-100 p-3">
                <Users className="mb-1 h-4 w-4" /> Capacity: {amenity.capacity}
              </p>
              <p className="rounded-md bg-slate-100 p-3">
                <Clock3 className="mb-1 h-4 w-4" /> {amenity.operatingStartTime} - {amenity.operatingEndTime}
              </p>
              <p className="rounded-md bg-slate-100 p-3">
                <CalendarDays className="mb-1 h-4 w-4" /> Book up to {amenity.rules.advanceBookingDays} days
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Rules</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>{amenity.rules.minSlotDurationMinutes}-minute minimum booking</li>
                <li>Maximum {amenity.rules.maxDurationMinutes / 60} hours per session</li>
                <li>Book up to {amenity.rules.advanceBookingDays} days in advance</li>
              </ul>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">Features</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenity.features.map((feature) => (
                  <Badge key={feature} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={disabledDays} className="mx-auto" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Time Slot</CardTitle>
          <p className="text-sm text-slate-600">Showing available slots for {format(selectedDate, "EEEE, MMM d")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSlots ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {slots.map((slot) => {
                const slotKey = `${slot.startTime}-${slot.endTime}`
                const isSelected = selectedSlot === slotKey

                return (
                  <button
                    key={slotKey}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => {
                      setSelectedSlot(slotKey)
                      setErrorMessage("")
                    }}
                    className={`min-h-12 rounded-lg border px-2 py-2 text-left text-xs transition sm:text-sm ${
                      !slot.isAvailable
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : isSelected
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <p className="font-medium">{slot.startTime}-{slot.endTime}</p>
                    <p>{slot.remainingCapacity} spots</p>
                  </button>
                )
              })}
            </div>
          )}

          <div className="max-w-xs space-y-2">
            <Label>How long do you want to book?</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions
                  .filter((option) => option >= amenity.rules.minSlotDurationMinutes && option <= amenity.rules.maxDurationMinutes)
                  .map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option} minutes
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Amenity: {amenity.name}</p>
          <p>Date: {format(selectedDate, "EEEE, MMM d")}</p>
          <p>Time: {selectedSlotData ? `${selectedSlotData.startTime} - ${selectedSlotData.endTime}` : "Not selected"}</p>
          <p>Duration: {duration} minutes</p>
          <p>Capacity: {selectedSlotData ? `${selectedSlotData.remainingCapacity}/${amenity.capacity}` : "-"}</p>
          <p>Cost: Free</p>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          <Button className="mt-2 min-h-11 w-full" onClick={() => setIsBookingModalOpen(true)} disabled={!selectedSlotData}>
            Confirm Booking
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book {amenity.name} on {format(selectedDate, "MMM d")} at {selectedSlotData?.startTime}?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <p>{amenity.name}</p>
            <p>{format(selectedDate, "EEEE, MMM d")}</p>
            <p>{selectedSlotData ? `${selectedSlotData.startTime}-${selectedSlotData.endTime}` : "No slot selected"}</p>
            <p>{duration} minutes</p>
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={isSubmitting}>
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
