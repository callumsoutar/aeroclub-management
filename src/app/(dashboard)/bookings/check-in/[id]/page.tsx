'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"
import { use } from "react"
import { BookingInvoiceForm } from "@/components/invoices/booking-invoice-form"
import { useAuthContext } from "@/providers/auth-provider"

interface AircraftRate {
  id: string
  rate: number
  flight_type_id: string
}

interface Booking {
  id: string
  Aircraft?: {
    registration: string
    record_tacho: boolean
    record_hobbs: boolean
    AircraftTypes?: {
      model: string
    }
    AircraftRates?: AircraftRate[]
  }
  FlightTypes?: {
    name: string
  }
  techLog?: {
    current_tacho: number
    current_hobbs: number
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
  flight_type_id: string
}

interface CheckInPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CheckInPage({ params }: CheckInPageProps) {
  const { id } = use(params)
  const { user } = useAuthContext()
  
  // State for end times
  const [endTacho, setEndTacho] = useState<string>('')
  const [endHobbs, setEndHobbs] = useState<string>('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRateId, setSelectedRateId] = useState<string>('')
  const [calculatedCharge, setCalculatedCharge] = useState<number | null>(null)
  const [additionalInvoiceItems, setAdditionalInvoiceItems] = useState<Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    chargeableId: string
  }>>([])

  // State for calculated times
  const [totalTacho, setTotalTacho] = useState<number | null>(null)
  const [totalHobbs, setTotalHobbs] = useState<number | null>(null)

  // Add state for showing the warning
  const [showTimeWarning, setShowTimeWarning] = useState(false)

  // Add state for comments
  const [comments, setComments] = useState('')

  // Add state for loading state
  const [loadingState, setLoadingState] = useState<'idle' | 'submitting' | 'redirecting'>('idle')
  const [loadingText, setLoadingText] = useState('')

  // Get the booking data
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
        
        // Set the initial selected rate ID based on the booking's flight type
        const defaultRate = bookingData.Aircraft?.AircraftRates?.find(
          (rate: AircraftRate) => rate.flight_type_id === bookingData.flight_type_id
        )
        if (defaultRate) {
          setSelectedRateId(defaultRate.id)
        }
        
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  // Calculate flight times when end values change
  useEffect(() => {
    if (booking?.techLog?.current_tacho && endTacho) {
      const startTacho = parseFloat(booking.techLog.current_tacho.toString())
      const endTachoNum = parseFloat(endTacho)
      if (!isNaN(endTachoNum) && endTachoNum >= startTacho) {
        setTotalTacho(Number((endTachoNum - startTacho).toFixed(2)))
      } else {
        setTotalTacho(null)
      }
    }
  }, [endTacho, booking?.techLog?.current_tacho])

  useEffect(() => {
    if (booking?.techLog?.current_hobbs && endHobbs) {
      const startHobbs = parseFloat(booking.techLog.current_hobbs.toString())
      const endHobbsNum = parseFloat(endHobbs)
      if (!isNaN(endHobbsNum) && endHobbsNum >= startHobbs) {
        setTotalHobbs(Number((endHobbsNum - startHobbs).toFixed(2)))
      } else {
        setTotalHobbs(null)
      }
    }
  }, [endHobbs, booking?.techLog?.current_hobbs])

  const calculateFlightCharges = () => {
    if (!booking?.Aircraft) return

    const usesTacho = booking.Aircraft.record_tacho
    const usesHobbs = booking.Aircraft.record_hobbs
    
    // Check time difference and set warning state
    setShowTimeWarning(checkTimeDifference())
    
    // Get the selected rate
    const selectedRate = booking.Aircraft.AircraftRates?.find(
      rate => rate.id === selectedRateId
    )

    if (!selectedRate) {
      console.log('No rate selected')
      return
    }

    let calculatedTime: number | null = null
    let recordingMethod = ''

    if (usesTacho) {
      calculatedTime = totalTacho
      recordingMethod = 'Tacho'
    } else if (usesHobbs) {
      calculatedTime = totalHobbs
      recordingMethod = 'Hobbs'
    }

    if (calculatedTime === null) {
      console.log('No valid time calculation available')
      return
    }

    // Convert rate to number and calculate charge with rounding
    const ratePerHour = Number(selectedRate.rate)
    const charge = Number((calculatedTime * ratePerHour).toFixed(2))

    // Debug logging
    console.log({
      recordingMethod,
      calculatedTime,
      ratePerHour,
      totalCharge: charge,
      usesTacho,
      usesHobbs,
    })

    setCalculatedCharge(charge)
  }

  const checkTimeDifference = () => {
    if (totalTacho !== null && totalHobbs !== null) {
      const difference = Math.abs(totalTacho - totalHobbs)
      const average = (totalTacho + totalHobbs) / 2
      const percentageDiff = (difference / average) * 100
      return percentageDiff > 10
    }
    return false
  }

  const handleInvoiceItemsChange = useCallback((items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    chargeableId: string
  }>) => {
    // Use requestAnimationFrame to ensure we're not updating state during render
    requestAnimationFrame(() => {
      // Remove the first item (flight charge) and keep the rest
      setAdditionalInvoiceItems(items.slice(1))
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    try {
      setLoadingState('submitting')
      setLoadingText('Processing check-in...')
      setError(null)

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.techLog?.current_tacho || !endTacho || !booking.techLog?.current_hobbs || !endHobbs) {
        throw new Error('Please enter all required flight times')
      }

      // Determine which time to use for billing based on aircraft settings
      const flightTime = booking.Aircraft?.record_tacho ? totalTacho : totalHobbs

      if (!flightTime) {
        throw new Error('Unable to calculate flight time')
      }

      // Get the selected rate for the chargeable
      const selectedRate = booking.Aircraft?.AircraftRates?.find(
        rate => rate.id === selectedRateId
      )

      if (!selectedRate) {
        throw new Error('Please select a rate')
      }

      if (!calculatedCharge) {
        throw new Error('Please calculate flight charges first')
      }

      setLoadingText('Creating flight hour chargeable...')
      // Ensure FLIGHT_HOUR chargeable exists
      const ensureChargeableResponse = await fetch('/api/chargeables/ensure-flight-hour', {
        method: 'POST',
      })

      if (!ensureChargeableResponse.ok) {
        throw new Error('Failed to ensure FLIGHT_HOUR chargeable exists')
      }

      const flightHourChargeable = await ensureChargeableResponse.json()

      if (!flightHourChargeable?.id) {
        throw new Error('Failed to get flight hour chargeable ID')
      }

      if (!user?.user_metadata?.organizationId) {
        throw new Error('Organization ID not found')
      }

      // Format the request body
      const requestBody = {
        startTacho: Number(booking.techLog.current_tacho),
        endTacho: Number(endTacho),
        startHobbs: Number(booking.techLog.current_hobbs),
        endHobbs: Number(endHobbs),
        flightTime: Number(flightTime),
        comments: comments || null,
        calculatedCharge: Number(calculatedCharge),
        chargeableId: flightHourChargeable.id,
        organizationId: user.user_metadata.organizationId,
        additionalInvoiceItems: additionalInvoiceItems.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total)
        }))
      }

      setLoadingText('Creating invoice...')
      const response = await fetch(`/api/bookings/${id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Check-in error:', errorData)
        throw new Error(errorData.error || 'Failed to complete check-in')
      }

      const result = await response.json()
      
      // Set redirecting state
      setLoadingState('redirecting')
      setLoadingText('Redirecting to invoice...')

      // Redirect to the new invoice
      window.location.href = `/invoices/view/${result.invoiceId}`
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoadingState('idle')
    }
  }, [
    booking,
    endTacho,
    endHobbs,
    totalTacho,
    totalHobbs,
    selectedRateId,
    id,
    comments,
    calculatedCharge,
    user?.user_metadata?.organizationId,
    additionalInvoiceItems
  ])

  // Loading overlay component
  const LoadingOverlay = () => {
    if (loadingState === 'idle') return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {loadingState === 'submitting' ? 'Processing Check-in' : 'Redirecting'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{loadingText}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div>Loading...</div>
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
    return <div>Booking not found</div>
  }

  // Get all rates for this aircraft
  const aircraftRates = booking.Aircraft?.AircraftRates || []
  
  // Find the default rate based on the booking's flight type
  const defaultRate = aircraftRates.find(rate => rate.flight_type_id === booking.flight_type_id)

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Flight Check-in</h1>
            <p className="text-muted-foreground">Complete flight information for booking #{id}</p>
          </div>
          <Button variant="outline">Cancel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Flight Information */}
          <div className="space-y-6">
            {/* Flight Information Card */}
            <Card>
              <CardHeader className="bg-blue-50/60 pb-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">Flight Information</h2>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-md">
                    {booking.FlightTypes?.name || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Aircraft</Label>
                    <p className="text-lg font-semibold">
                      {booking.Aircraft?.registration}, {booking.Aircraft?.AircraftTypes?.model}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Member</Label>
                    <p className="text-lg font-semibold">{booking.User_Booking_user_idToUser?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Instructor</Label>
                    <p className="text-lg font-semibold">{booking.User_Booking_instructor_idToUser?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Lesson</Label>
                    <p className="text-lg font-semibold">{booking.Lesson?.name || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aircraft Times Card */}
            <Card>
              <CardHeader className="bg-purple-50/60 pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Aircraft Times</h2>
                  <Button 
                    className="bg-blue-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={calculateFlightCharges}
                  >
                    Calculate Flight Charges
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-x-12">
                  {/* Left Column - Tacho Times */}
                  <div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-1/2">
                          <Label className="text-sm font-medium">Start Tacho</Label>
                          <Input 
                            value={booking.techLog?.current_tacho?.toString() || '0'} 
                            disabled 
                            className="bg-slate-50 border-slate-200 mt-1"
                          />
                        </div>
                        <div className="w-1/2">
                          <Label className="text-sm font-medium">End Tacho</Label>
                          <Input 
                            placeholder="Enter" 
                            value={endTacho}
                            onChange={(e) => setEndTacho(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {totalTacho !== null && (
                        <div className="mt-1">
                          <Label className="text-sm text-emerald-600 font-medium">
                            Time: {totalTacho.toFixed(2)} hrs
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Hobbs Times */}
                  <div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-1/2">
                          <Label className="text-sm font-medium">Start Hobbs</Label>
                          <Input 
                            value={booking.techLog?.current_hobbs?.toString() || '0'} 
                            disabled 
                            className="bg-slate-50 border-slate-200 mt-1"
                          />
                        </div>
                        <div className="w-1/2">
                          <Label className="text-sm font-medium">End Hobbs</Label>
                          <Input 
                            placeholder="Enter" 
                            value={endHobbs}
                            onChange={(e) => setEndHobbs(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {totalHobbs !== null && (
                        <div className="mt-1">
                          <Label className="text-sm text-emerald-600 font-medium">
                            Time: {totalHobbs.toFixed(2)} hrs
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add the warning message after both time inputs */}
                {showTimeWarning && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-amber-600">
                      Tacho and Hobbs times vary by more than 10%
                    </p>
                  </div>
                )}

                {/* Charge Rate Selection */}
                <div className="mt-6">
                  <Label className="text-sm font-medium">Charge Rate</Label>
                  <Select 
                    defaultValue={defaultRate?.id} 
                    onValueChange={setSelectedRateId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {aircraftRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          {booking.FlightTypes?.name} - ${rate.rate.toString()}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader className="bg-blue-50/60 pb-4">
                <h2 className="text-lg font-semibold">Instructor Comments</h2>
              </CardHeader>
              <CardContent className="pt-4">
                <textarea 
                  className="w-full min-h-[100px] p-2 border rounded-md" 
                  placeholder="Enter flight comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Invoice Details */}
          <div className="space-y-6">
            <BookingInvoiceForm 
              calculatedCharge={calculatedCharge}
              booking={booking}
              onInvoiceItemsChange={handleInvoiceItemsChange}
            />
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Check-in'}
            </Button>
            {error && (
              <div className="text-red-600 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      <LoadingOverlay />
    </>
  )
} 