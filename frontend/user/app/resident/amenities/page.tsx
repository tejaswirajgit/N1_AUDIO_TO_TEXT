"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Building2, Clock3, MapPin, RefreshCw, Search, Star, Users } from "lucide-react"
import { amenities, amenityTypeLabel } from "@/lib/resident-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const filters = ["all", "gym", "pool", "lounge", "spa"] as const

type Filter = (typeof filters)[number]

export default function AmenitiesPage() {
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<Filter>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const filteredAmenities = useMemo(() => {
    const normalized = query.toLowerCase().trim()

    return amenities.filter((amenity) => {
      const matchesType = activeFilter === "all" ? true : amenity.type === activeFilter
      const matchesQuery =
        normalized.length === 0 ||
        amenity.name.toLowerCase().includes(normalized) ||
        amenity.type.toLowerCase().includes(normalized)

      return matchesType && matchesQuery
    })
  }, [activeFilter, query])

  const filterCount = (filter: Filter) =>
    filter === "all" ? amenities.length : amenities.filter((amenity) => amenity.type === filter).length

  const onRefresh = () => {
    setIsError(false)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 700)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white">
        <p className="text-sm opacity-90">Skyline Residences</p>
        <h1 className="mt-1 text-2xl font-semibold">Available Amenities</h1>
        <p className="mt-1 text-sm opacity-90">Book your favorite spaces</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search amenities..."
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                variant={activeFilter === filter ? "default" : "outline"}
                className="min-h-11"
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)} ({filterCount(filter)})
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="min-h-11 bg-transparent" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" className="min-h-11 bg-transparent" onClick={() => setIsError((prev) => !prev)}>
              Toggle Error
            </Button>
            <Button type="button" variant="outline" className="min-h-11 bg-transparent" onClick={() => setIsLoading((prev) => !prev)}>
              Toggle Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-700">
            <span>Could not load amenities.</span>
            <Button size="sm" variant="destructive" onClick={onRefresh}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <Skeleton className="h-44 w-full rounded-t-lg" />
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredAmenities.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-semibold">No amenities available right now</h3>
            <p className="text-sm text-slate-600">Check back later or contact your building manager.</p>
            <Button onClick={onRefresh}>Refresh</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAmenities.map((amenity) => (
            <Card key={amenity.id} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative h-44 w-full">
                <Image src={amenity.imageUrl} alt={amenity.name} fill className="object-cover" />
              </div>
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{amenity.name}</CardTitle>
                  <Badge>{amenityTypeLabel[amenity.type]}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{amenity.description}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {amenity.operatingStartTime} - {amenity.operatingEndTime}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" /> {amenity.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-blue-500" /> {amenity.nextAvailable}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-emerald-500" /> {amenity.capacity}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="min-h-11 w-full">
                  <Link href={`/resident/amenities/${amenity.id}`}>Book Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
