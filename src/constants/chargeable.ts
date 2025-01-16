import { ChargeableType } from '@/types/booking'

export const TYPE_ORDER = [
  'FLIGHT_HOUR',
  'INSTRUCTION',
  'LANDING_FEE',
  'AIRWAYS_FEE',
  'EQUIPMENT',
  'MEMBERSHIP_FEE',
  'OTHER'
] as const

export const TYPE_LABELS: Record<ChargeableType, string> = {
  FLIGHT_HOUR: '✈️ Flight Hours',
  INSTRUCTION: '👨‍🏫 Instruction',
  LANDING_FEE: '🛬 Landing Fees',
  AIRWAYS_FEE: '🗺️ Airways Fees',
  EQUIPMENT: '🎧 Equipment',
  MEMBERSHIP_FEE: '🎫 Membership',
  OTHER: '📝 Other'
}

export const DEFAULT_TAX_RATE = 0.15 // 15% tax rate

export const INVOICE_DUE_DAYS = 14 // Default due date is 14 days from now 