import { db } from "@/lib/db"
import { UserRole, MembershipStatus, MembershipType, LicenceType } from "@prisma/client"
import { Prisma } from "@prisma/client"

export class MemberService {
  static async getMemberById(id: string, organizationId: string) {
    return db.user.findFirst({
      where: {
        AND: [
          { id },
          { organizationId },
          { role: UserRole.MEMBER }
        ]
      },
      include: {
        pilotDetails: true,
        memberAccount: true,
        UserMemberships: {
          where: {
            organizationId,
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1,
        },
        invoices: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          include: {
            payments: true
          }
        }
      },
    })
  }

  static async getMembers(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
    searchQuery?: string
  ) {
    const offset = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      organizationId,
      role: UserRole.MEMBER,
      ...(searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          { memberNumber: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
        ]
      } : {})
    }

    const [members, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          memberAccount: {
            select: {
              balance: true,
            },
          },
          UserMemberships: {
            where: {
              organizationId,
            },
            orderBy: {
              startDate: 'desc'
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.user.count({ where })
    ])

    return {
      members,
      totalCount,
    }
  }

  static async createMember(data: {
    email: string
    name: string
    organizationId: string
    memberNumber?: string
    phone?: string
    address?: string
    birthDate?: Date
    membershipType: MembershipType
  }) {
    return db.$transaction(async (tx) => {
      // Create the user with MEMBER role
      const member = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          organizationId: data.organizationId,
          role: UserRole.MEMBER,
          memberStatus: MembershipStatus.ACTIVE,
          memberNumber: data.memberNumber,
          phone: data.phone,
          address: data.address,
          birthDate: data.birthDate,
          password: "", // This should be handled by your auth system
          // Create membership
          UserMemberships: {
            create: {
              organizationId: data.organizationId,
              membershipType: data.membershipType,
              status: MembershipStatus.ACTIVE,
            }
          },
          // Create member account
          memberAccount: {
            create: {
              organizationId: data.organizationId,
              balance: 0,
            }
          }
        },
        include: {
          UserMemberships: true,
          memberAccount: true,
        },
      })

      return member
    })
  }

  static async updateMember(id: string, organizationId: string, data: {
    name?: string
    phone?: string
    address?: string
    birthDate?: Date
    memberStatus?: MembershipStatus
  }) {
    return db.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        birthDate: data.birthDate,
        memberStatus: data.memberStatus,
      },
      include: {
        pilotDetails: true,
        memberAccount: true,
        UserMemberships: {
          where: {
            organizationId,
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1,
        },
      },
    })
  }

  static async updatePilotDetails(userId: string, data: {
    caaClientNumber?: string
    licenceType?: LicenceType
    typeRatings?: string[]
    class1Expiry?: Date
    class2Expiry?: Date
    dl9Expiry?: Date
    bfrExpiry?: Date
    endorsements?: string[]
    primeRatings?: string[]
  }) {
    return db.userPilotDetails.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        ...data,
      },
      update: data,
    })
  }

  static async getMemberBookings(
    userId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit

    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where: {
          user_id: userId,
          organization_id: organizationId,
        },
        include: {
          Aircraft: {
            select: {
              registration: true,
              AircraftTypes: {
                select: {
                  model: true,
                },
              },
            },
          },
          User_Booking_instructor_idToUser: {
            select: {
              name: true,
            },
          },
          BookingFlightTimes: true,
        },
        orderBy: {
          startTime: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.booking.count({
        where: {
          user_id: userId,
          organization_id: organizationId,
        },
      }),
    ])

    return {
      bookings,
      totalCount,
    }
  }
} 