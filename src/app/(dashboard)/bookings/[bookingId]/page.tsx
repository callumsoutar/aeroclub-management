"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { use } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  Plane, 
  Users, 
  FileText, 
  Timer,
  Calendar,
  ClipboardList,
  Navigation,
  Clock,
  MessageSquare
} from "lucide-react"

interface BookingDetails {
  id: string
  type: string
  status: string
  description: string
  created_at: string
  startTime: string
  endTime: string
  Aircraft?: {
    registration: string
    status: string
    type_id: string
    AircraftTypes: {
      model: string
    }
  }
  User_Booking_instructor_idToUser?: {
    name: string
    email: string
  }
  User_Booking_user_idToUser?: {
    name: string
    email: string
  }
  BookingDetails?: {
    route: string
    eta: string
    comments: string
    instructor_comment: string
  }
  BookingFlightTimes?: {
    start_tacho: number
    end_tacho: number
    start_hobbs: number
    end_hobbs: number
    flight_time: number
  }
  FlightTypes?: {
    name: string
    description: string
  }
  Lesson?: {
    name: string
    description: string
    duration: number
  }
  flight_type_id: string
  lesson_id: string
}

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const resolvedParams = use(params)
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Please sign in to view booking details")
        setLoading(false)
        return
      }
      fetchBooking()
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${resolvedParams.bookingId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch booking")
        }
        const data = await response.json()
        setBooking(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [resolvedParams.bookingId, supabase])

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "unconfirmed":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      case "flying":
        return "bg-sky-100 text-sky-800 hover:bg-sky-100"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "complete":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Booking not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm border">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Flight Details
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                className={`
                  px-6 py-2 text-base font-medium rounded-full capitalize
                  ${booking.status.toLowerCase() === 'flying' 
                    ? 'bg-sky-100 text-sky-800 animate-badge-pulse flex items-center gap-2' 
                    : getStatusStyles(booking.status)
                  }
                `}
              >
                {booking.status.toLowerCase() === 'flying' && (
                  <Plane className="h-4 w-4 animate-badge-plane" />
                )}
                {booking.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Information */}
              <Card className="overflow-hidden border-none shadow-sm">
                <CardHeader className="border-b bg-emerald-50 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-5 w-5 text-emerald-600" />
                      <CardTitle>Booking Information</CardTitle>
                    </div>
                    <Badge className="text-sm font-medium bg-emerald-100/90 text-emerald-900 px-3 py-1 rounded-md">
                      {booking.FlightTypes?.name || "N/A"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Flight Details Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/60 rounded-lg p-4">
                        <div className="space-y-4">
                          <div className="border-b border-blue-100 pb-3">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">Aircraft Details</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-blue-600">Registration</label>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{booking.Aircraft?.registration || "N/A"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-blue-600">Aircraft Type</label>
                                <p className="text-lg font-semibold text-blue-800 mt-1">{booking.Aircraft?.AircraftTypes?.model || "N/A"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50/60 rounded-lg p-4">
                        <div className="space-y-4">
                          <div className="border-b border-purple-100 pb-3">
                            <h3 className="text-lg font-semibold text-purple-900 mb-4">Flight Schedule</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-purple-600">Date</label>
                                <p className="text-lg font-semibold text-purple-900 mt-1">
                                  {booking.startTime ? format(new Date(booking.startTime), "EEEE do MMMM yyyy") : "N/A"}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <label className="text-sm font-medium text-purple-600">Start Time</label>
                                  <p className="text-2xl font-bold text-purple-900 mt-1">
                                    {booking.startTime ? format(new Date(booking.startTime), "h:mm a") : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-purple-600">End Time</label>
                                  <p className="text-2xl font-bold text-purple-900 mt-1">
                                    {booking.endTime ? format(new Date(booking.endTime), "h:mm a") : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/60 rounded-lg p-3">
                        <div>
                          <label className="text-sm font-medium text-blue-800">Description</label>
                          <p className="text-base font-medium mt-0.5">{booking.description || "N/A"}</p>
                        </div>
                      </div>

                      <div className="bg-purple-50/60 rounded-lg p-3">
                        <div>
                          <label className="text-sm font-medium text-purple-800">Lesson</label>
                          <p className="text-base font-semibold mt-0.5">{booking.Lesson?.name || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs Section */}
              <div className="mt-6 border rounded-lg overflow-hidden bg-white shadow-sm">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full border-b bg-slate-50 p-0">
                    <TabsTrigger 
                      value="details"
                      className="flex-1 px-8 py-3 rounded-none border-r data-[state=active]:bg-white data-[state=active]:border-b-0 data-[state=active]:shadow-none transition-all"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Details</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="flight-times"
                      className="flex-1 px-8 py-3 rounded-none border-r data-[state=active]:bg-white data-[state=active]:border-b-0 data-[state=active]:shadow-none transition-all"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Timer className="h-4 w-4" />
                        <span>Flight Times</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history"
                      className="flex-1 px-8 py-3 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-0 data-[state=active]:shadow-none transition-all"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>History</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="m-0">
                    <div className="p-6 bg-white">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Navigation className="h-4 w-4 text-slate-600" />
                              <label className="text-sm font-medium text-slate-600">Route</label>
                            </div>
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg">
                              <p className="text-base font-medium">
                                {booking.BookingDetails?.route || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-slate-600" />
                              <label className="text-sm font-medium text-slate-600">ETA</label>
                            </div>
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg">
                              <p className="text-base font-medium">
                                {booking.BookingDetails?.eta ? format(new Date(booking.BookingDetails.eta), "p") : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                        {booking.BookingDetails?.instructor_comment && (
                          <div>
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4 text-slate-600" />
                              <label className="text-sm font-medium text-slate-600">Instructor Comments</label>
                            </div>
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg">
                              <p className="text-base">
                                {booking.BookingDetails.instructor_comment}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="flight-times" className="m-0">
                    {booking.BookingFlightTimes && (
                      <div className="p-6 bg-white">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Tacho Time</label>
                            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Start:</span>
                                <span className="font-medium">{booking.BookingFlightTimes.start_tacho || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">End:</span>
                                <span className="font-medium">{booking.BookingFlightTimes.end_tacho || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Hobbs Time</label>
                            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Start:</span>
                                <span className="font-medium">{booking.BookingFlightTimes.start_hobbs || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">End:</span>
                                <span className="font-medium">{booking.BookingFlightTimes.end_hobbs || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600 mb-2 block">Total Time</label>
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <p className="text-2xl font-bold text-center">{booking.BookingFlightTimes.flight_time || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="m-0">
                    <div className="p-6 bg-white">
                      <div className="flex items-center justify-center py-8 text-slate-500">
                        <Calendar className="h-5 w-5 mr-2 opacity-50" />
                        <span>No history available</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* People Card */}
              <Card className="overflow-hidden border-none shadow-sm">
                <CardHeader className="border-b bg-emerald-50 px-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <CardTitle>People</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Instructor</label>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="font-medium">{booking.User_Booking_instructor_idToUser?.name || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student</label>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="font-medium">{booking.User_Booking_user_idToUser?.name || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="overflow-hidden border-none shadow-sm">
                <CardHeader className="border-b bg-emerald-50 px-6">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                    <CardTitle>Actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {booking.status.toLowerCase() === "confirmed" && (
                      <Link href={`/bookings/check-out/${booking.id}`}>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-medium"
                        >
                          <Timer className="h-5 w-5 mr-2" />
                          Check Flight Out
                        </Button>
                      </Link>
                    )}
                    <div className="space-y-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-sky-50/50 border-slate-200"
                      >
                        <FileText className="h-4 w-4 mr-2 text-sky-600" />
                        Add Comments
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-emerald-50/50 border-slate-200"
                      >
                        <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                        Reschedule Booking
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 