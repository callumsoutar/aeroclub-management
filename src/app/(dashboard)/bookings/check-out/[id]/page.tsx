'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, Timer, Navigation, Package, User, GraduationCap, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FlightLoadingModal } from "@/components/loading/flight-loading-modal"

interface Equipment {
  id: string
  name: string
  quantity: number
  selected: boolean
}

interface Booking {
  id: string
  status: string
  description: string
  Aircraft?: {
    registration: string
    record_tacho: boolean
    record_hobbs: boolean
    AircraftTypes?: {
      model: string
    }
  }
  FlightTypes?: {
    name: string
  }
  User_Booking_user_idToUser?: {
    name: string
  }
  User_Booking_instructor_idToUser?: {
    name: string
  }
  Lesson?: {
    name: string
  }
}

interface CheckOutPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CheckOutPage({ params }: CheckOutPageProps) {
  const { id } = use(params)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [route, setRoute] = useState("")
  const [eta, setEta] = useState("")
  const [passengers, setPassengers] = useState("")
  const [equipment, setEquipment] = useState<Equipment[]>([
    { id: "lifejackets", name: "Lifejackets", quantity: 0, selected: false },
    { id: "headset", name: "Headset", quantity: 0, selected: false },
    { id: "maps", name: "Maps", quantity: 0, selected: false },
    { id: "aip-vol-1", name: "AIP Vol 1", quantity: 0, selected: false },
    { id: "aip-vol-4", name: "AIP Vol 4", quantity: 0, selected: false },
  ])

  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleEquipmentChange = (id: string, selected: boolean) => {
    setEquipment(equipment.map(item => 
      item.id === id ? { ...item, selected } : item
    ))
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    setEquipment(equipment.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
    ))
  }

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          redirect("/auth/signin")
        }

        const response = await fetch(`/api/bookings/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch booking')
        }

        const bookingData = await response.json()
        setBooking(bookingData)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  const handleCheckOut = async () => {
    try {
      setIsCheckingOut(true)
      const response = await fetch(`/api/bookings/${id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route,
          eta,
          passengers,
          equipment: equipment.filter(item => item.selected),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to check out flight')
      }

      // Redirect to the booking details page after successful check-out
      window.location.href = `/bookings/${id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during check-out')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">Loading booking data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error loading booking: {error}
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg">
          No booking found
        </div>
      </div>
    )
  }

  return (
    <>
      <FlightLoadingModal 
        isOpen={isCheckingOut} 
        onClose={() => {
          // Navigate to booking details page after success state
          window.location.href = `/bookings/${id}`
        }} 
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm border">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Flight Check-out</h1>
                <p className="text-muted-foreground">Complete flight details before departure</p>
              </div>
              <Badge 
                className={`
                  px-6 py-2 text-base font-medium rounded-full
                  ${booking.status.toLowerCase() === 'flying' 
                    ? 'bg-sky-100 text-sky-800 animate-badge-pulse flex items-center gap-2' 
                    : 'bg-sky-100 text-sky-800'
                  }
                `}
              >
                {booking.status.toLowerCase() === 'flying' && (
                  <Plane className="h-4 w-4 animate-badge-plane" />
                )}
                {booking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Flight Information */}
                <Card className="overflow-hidden border-none shadow-sm">
                  <CardHeader className="border-b bg-emerald-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-emerald-600" />
                        <CardTitle>Flight Information</CardTitle>
                      </div>
                      <Badge className="text-sm font-medium bg-emerald-100/90 text-emerald-900 px-2.5 py-0.5 rounded-md">
                        {booking.FlightTypes?.name || "N/A"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50/80 rounded-lg p-3">
                          <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                            <Plane className="h-3 w-3" />
                            Aircraft
                          </Label>
                          <div className="mt-0.5">
                            <p className="text-lg font-bold text-slate-900">
                              {booking.Aircraft?.registration}
                            </p>
                            <p className="text-sm text-slate-600">
                              {booking.Aircraft?.AircraftTypes?.model}
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50/80 rounded-lg p-3">
                          <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Member
                          </Label>
                          <div className="mt-0.5">
                            <p className="text-lg font-bold text-slate-900">
                              {booking.User_Booking_user_idToUser?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50/80 rounded-lg p-3">
                          <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Instructor
                          </Label>
                          <div className="mt-0.5">
                            <p className="text-lg font-bold text-slate-900">
                              {booking.User_Booking_instructor_idToUser?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50/80 rounded-lg p-3">
                          <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Lesson
                          </Label>
                          <div className="mt-0.5">
                            <p className="text-lg font-bold text-slate-900">
                              {booking.Lesson?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/80 rounded-lg p-3">
                        <Label className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Description
                        </Label>
                        <div className="mt-0.5">
                          <p className="text-sm text-slate-700">
                            {booking.description || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Check-out Form */}
                <Card className="overflow-hidden border-none shadow-sm">
                  <CardHeader className="border-b bg-blue-50 px-6">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      <CardTitle>Flight Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Number of Passengers</Label>
                          <Input 
                            type="number"
                            placeholder="Enter number of passengers"
                            min="0"
                            value={passengers}
                            onChange={(e) => setPassengers(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ETA</Label>
                          <Input 
                            type="time"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Route</Label>
                        <Input 
                          placeholder="NZPP - NZWN - NZPP"
                          value={route}
                          onChange={(e) => setRoute(e.target.value)}
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full mt-2 border-blue-200 hover:bg-blue-50/50"
                          >
                            <Package className="h-4 w-4 mr-2 text-blue-600" />
                            Select Equipment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader className="bg-blue-50 -mx-6 -mt-6 p-6 border-b">
                            <DialogTitle className="flex items-center gap-2 text-xl text-blue-950">
                              <Package className="h-5 w-5 text-blue-600" />
                              Equipment Selection
                            </DialogTitle>
                            <p className="text-sm text-blue-600 mt-2">
                              Select the equipment needed for your flight and specify the quantity required.
                            </p>
                          </DialogHeader>
                          <div className="grid gap-4 py-6">
                            {equipment.map((item) => (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer group"
                                onClick={() => handleEquipmentChange(item.id, !item.selected)}
                              >
                                <Checkbox
                                  id={item.id}
                                  checked={item.selected}
                                  onCheckedChange={(checked) => handleEquipmentChange(item.id, checked as boolean)}
                                  className="h-5 w-5 text-blue-600 rounded-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1">
                                  <Label 
                                    htmlFor={item.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {item.name}
                                  </Label>
                                </div>
                                <div className="w-24" onClick={(e) => e.stopPropagation()}>
                                  <Select
                                    value={item.quantity.toString()}
                                    onValueChange={(value) => handleQuantityChange(item.id, parseInt(value))}
                                    disabled={!item.selected}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="0" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[...Array(7)].map((_, i) => (
                                        <SelectItem key={i} value={i.toString()}>
                                          {i}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Actions Card */}
                <Card className="overflow-hidden border-none shadow-sm">
                  <CardHeader className="border-b bg-blue-50 px-6">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-5 w-5 text-blue-600" />
                      <CardTitle>Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-medium"
                      onClick={handleCheckOut}
                    >
                      Check Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 