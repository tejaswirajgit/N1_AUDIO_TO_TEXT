import { addDays, format, setHours, setMinutes, startOfDay } from "date-fns"

export type AmenityType = "gym" | "pool" | "lounge" | "spa" | "conference_room"
export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show"

export interface Amenity {
  id: string
  name: string
  type: AmenityType
  description: string
  capacity: number
  imageUrl: string
  operatingStartTime: string
  operatingEndTime: string
  rules: {
    minSlotDurationMinutes: number
    maxDurationMinutes: number
    advanceBookingDays: number
  }
  rating: number
  reviews: number
  features: string[]
  nextAvailable: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
  remainingCapacity: number
  isAvailable: boolean
}

export interface Booking {
  id: string
  amenityId: string
  amenityName: string
  amenityType: AmenityType
  imageUrl: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  createdAt: string
  cancelledAt?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  apartment: string
  buildingName: string
  joinDate: string
  avatarUrl: string
  notifications: {
    bookingConfirmations: boolean
    bookingReminders: boolean
    newAmenities: boolean
    announcements: boolean
    maintenance: boolean
  }
  preferences: {
    theme: "light" | "dark"
    language: "en" | "es"
  }
}

export const amenityTypeLabel: Record<AmenityType, string> = {
  gym: "GYM",
  pool: "POOL",
  lounge: "LOUNGE",
  spa: "SPA",
  conference_room: "CONFERENCE",
}

export const amenities: Amenity[] = [
  {
    id: "amenity-001",
    name: "Fitness Center",
    type: "gym",
    description: "State-of-the-art fitness facility with cardio, strength, and stretching zones.",
    capacity: 30,
    imageUrl: "/placeholder.jpg",
    operatingStartTime: "06:00",
    operatingEndTime: "22:00",
    rules: { minSlotDurationMinutes: 30, maxDurationMinutes: 120, advanceBookingDays: 7 },
    rating: 4.5,
    reviews: 12,
    features: ["Equipment", "Showers", "Air Conditioning", "Lockers"],
    nextAvailable: "2 hours",
  },
  {
    id: "amenity-002",
    name: "Swimming Pool",
    type: "pool",
    description: "Indoor temperature-controlled lap pool with lounge deck.",
    capacity: 50,
    imageUrl: "/placeholder.jpg",
    operatingStartTime: "08:00",
    operatingEndTime: "20:00",
    rules: { minSlotDurationMinutes: 30, maxDurationMinutes: 120, advanceBookingDays: 7 },
    rating: 4.8,
    reviews: 21,
    features: ["Lifeguard", "Changing Room", "Shower Area", "Family Lanes"],
    nextAvailable: "1 hour",
  },
  {
    id: "amenity-003",
    name: "Community Lounge",
    type: "lounge",
    description: "Comfortable space for guests, events, and community gatherings.",
    capacity: 20,
    imageUrl: "/placeholder.jpg",
    operatingStartTime: "10:00",
    operatingEndTime: "22:00",
    rules: { minSlotDurationMinutes: 30, maxDurationMinutes: 120, advanceBookingDays: 10 },
    rating: 4.2,
    reviews: 8,
    features: ["Wi-Fi", "TV", "Snacks Bar", "Board Games"],
    nextAvailable: "30 min",
  },
  {
    id: "amenity-004",
    name: "Wellness Spa",
    type: "spa",
    description: "Relaxing private rooms with steam and recovery amenities.",
    capacity: 10,
    imageUrl: "/placeholder.jpg",
    operatingStartTime: "09:00",
    operatingEndTime: "21:00",
    rules: { minSlotDurationMinutes: 30, maxDurationMinutes: 120, advanceBookingDays: 5 },
    rating: 4.6,
    reviews: 16,
    features: ["Steam", "Massage Chairs", "Aromatherapy", "Shower"],
    nextAvailable: "45 min",
  },
]

export const upcomingBookings: Booking[] = [
  {
    id: "BOOK-001",
    amenityId: "amenity-001",
    amenityName: "Fitness Center",
    amenityType: "gym",
    imageUrl: "/placeholder.jpg",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    startTime: "14:00",
    endTime: "15:00",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "BOOK-002",
    amenityId: "amenity-002",
    amenityName: "Swimming Pool",
    amenityType: "pool",
    imageUrl: "/placeholder.jpg",
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    startTime: "10:00",
    endTime: "11:00",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
]

export const bookingHistory: Booking[] = [
  {
    id: "BOOK-900",
    amenityId: "amenity-001",
    amenityName: "Fitness Center",
    amenityType: "gym",
    imageUrl: "/placeholder.jpg",
    date: format(addDays(new Date(), -7), "yyyy-MM-dd"),
    startTime: "18:00",
    endTime: "19:00",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "BOOK-901",
    amenityId: "amenity-003",
    amenityName: "Community Lounge",
    amenityType: "lounge",
    imageUrl: "/placeholder.jpg",
    date: format(addDays(new Date(), -9), "yyyy-MM-dd"),
    startTime: "19:00",
    endTime: "20:00",
    status: "cancelled",
    createdAt: new Date().toISOString(),
    cancelledAt: new Date().toISOString(),
  },
  {
    id: "BOOK-902",
    amenityId: "amenity-002",
    amenityName: "Swimming Pool",
    amenityType: "pool",
    imageUrl: "/placeholder.jpg",
    date: format(addDays(new Date(), -15), "yyyy-MM-dd"),
    startTime: "07:00",
    endTime: "08:00",
    status: "no_show",
    createdAt: new Date().toISOString(),
  },
]

export const userProfile: UserProfile = {
  id: "USR-001",
  name: "John Smith",
  email: "john@email.com",
  phone: "+1-555-0101",
  apartment: "A-301",
  buildingName: "Skyline Residences",
  joinDate: "2025-01-15",
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

export const getAmenityById = (id: string) => amenities.find((item) => item.id === id)

export const generateAvailabilitySlots = (amenity: Amenity, date: Date): TimeSlot[] => {
  const startHour = Number(amenity.operatingStartTime.split(":")[0])
  const endHour = Number(amenity.operatingEndTime.split(":")[0])
  const slotCount = (endHour - startHour) * 2

  return Array.from({ length: slotCount }, (_, index) => {
    const slotStart = setMinutes(setHours(startOfDay(date), startHour), index * 30)
    const slotEnd = addDays(slotStart, 0)
    slotEnd.setMinutes(slotStart.getMinutes() + 30)

    const isPeak = slotStart.getHours() >= 18 && slotStart.getHours() <= 20
    const remainingCapacity = Math.max(0, amenity.capacity - ((index * 7 + 9) % amenity.capacity) - (isPeak ? 6 : 0))

    return {
      startTime: format(slotStart, "HH:mm"),
      endTime: format(slotEnd, "HH:mm"),
      remainingCapacity,
      isAvailable: remainingCapacity > 0,
    }
  })
}
