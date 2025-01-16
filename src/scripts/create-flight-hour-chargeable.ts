import { db } from '@/lib/db'

export async function createFlightHourChargeable(organizationId: string) {
  try {
    // Check if FLIGHT_HOUR chargeable already exists
    const existingChargeable = await db.chargeable.findFirst({
      where: {
        type: 'FLIGHT_HOUR',
        organizationId,
        isActive: true,
      },
    })

    if (!existingChargeable) {
      // Create the FLIGHT_HOUR chargeable
      const chargeable = await db.chargeable.create({
        data: {
          name: 'Flight Time',
          description: 'Standard flight time charge',
          type: 'FLIGHT_HOUR',
          unitPrice: 0, // This will be overridden by the aircraft rate
          taxRate: 0.15,
          isActive: true,
          organizationId,
          unitPriceInclTax: 0, // This will be overridden by the aircraft rate
        },
      })

      console.log('Created FLIGHT_HOUR chargeable:', chargeable)
      return chargeable
    }

    console.log('FLIGHT_HOUR chargeable already exists:', existingChargeable)
    return existingChargeable
  } catch (error) {
    console.error('Error creating FLIGHT_HOUR chargeable:', error)
    throw error
  }
} 