export type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
  chargeableId: string
}

export type Chargeable = {
  id: string
  name: string
  unitPrice: number
  description?: string
  type: ChargeableType
}

export type ChargeableType = 
  | 'MEMBERSHIP_FEE' 
  | 'FLIGHT_HOUR' 
  | 'LANDING_FEE' 
  | 'INSTRUCTION' 
  | 'EQUIPMENT' 
  | 'OTHER' 
  | 'AIRWAYS_FEE'

export interface BookingInvoiceFormProps {
  calculatedCharge: number | null
  booking: {
    id: string
    User_Booking_user_idToUser?: {
      name: string
    }
    Aircraft?: {
      registration: string
      AircraftTypes?: {
        model: string
      }
    }
    FlightTypes?: {
      name: string
    }
  }
  onInvoiceItemsChange?: (items: InvoiceItem[]) => void
}

export interface BookingFlightTimes {
  id: string
  start_tacho: number
  end_tacho: number
  start_hobbs: number
  end_hobbs: number
  flight_time: number
}

export interface BookingDetails {
  id: string
  route?: string
  eta?: Date
  comments?: string
  instructor_comment?: string
} 