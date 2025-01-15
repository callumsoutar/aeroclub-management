/*
  Warnings:

  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Invoice` table. All the data in the column will be lost.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invoiceNumber` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ChargeableType" AS ENUM ('MEMBERSHIP_FEE', 'FLIGHT_HOUR', 'LANDING_FEE', 'INSTRUCTION', 'EQUIPMENT', 'OTHER');

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
DROP COLUMN "description",
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidDate" TIMESTAMP(3),
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "invoiceId" TEXT NOT NULL,
    "chargeableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chargeable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChargeableType" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chargeable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_chargeableId_idx" ON "InvoiceItem"("chargeableId");

-- CreateIndex
CREATE INDEX "Chargeable_organizationId_idx" ON "Chargeable"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_chargeableId_fkey" FOREIGN KEY ("chargeableId") REFERENCES "Chargeable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chargeable" ADD CONSTRAINT "Chargeable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
