import { db } from "@/lib/db"
import { InvoiceStatus } from "@prisma/client"

export class InvoiceService {
  static async getInvoiceById(id: string, organizationId: string) {
    return db.invoice.findFirst({
      where: {
        AND: [
          { id },
          { organizationId }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            processedAt: true,
          }
        }
      },
    })
  }

  static async getInvoicesForOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit

    const [invoices, totalCount] = await Promise.all([
      db.invoice.findMany({
        where: {
          organizationId,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({
        where: {
          organizationId,
        },
      }),
    ])

    return {
      invoices,
      totalCount,
    }
  }

  static async getMemberInvoices(
    userId: string,
    page: number = 1,
    limit: number = 5
  ) {
    const offset = (page - 1) * limit

    const [invoices, totalCount] = await Promise.all([
      db.invoice.findMany({
        where: {
          userId,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      db.invoice.count({
        where: {
          userId,
        },
      }),
    ])

    return {
      invoices,
      totalCount,
    }
  }

  static async getUnpaidInvoicesCount(userId: string) {
    return db.invoice.count({
      where: {
        userId,
        status: InvoiceStatus.PENDING,
      },
    })
  }

  static async createInvoice(data: {
    userId: string
    organizationId: string
    subtotal: number
    tax: number
    total: number
    dueDate: Date
    items: Array<{
      description: string
      unitPrice: number
      quantity: number
      chargeableId: string
    }>
  }) {
    return db.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          status: InvoiceStatus.PENDING,
          dueDate: data.dueDate,
          items: {
            create: data.items.map(item => ({
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              chargeableId: item.chargeableId,
              organizationId: data.organizationId,
              tax: 0.15, // Default tax rate
              total: item.unitPrice * item.quantity * 1.15, // Including tax
              subTotal: item.unitPrice * item.quantity
            }))
          }
        },
        include: {
          items: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      return invoice
    })
  }
} 