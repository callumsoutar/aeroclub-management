/*
  Warnings:

  - A unique constraint covering the columns `[memberNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unitPriceInclTax` to the `Chargeable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'VOUCHER', 'ACCOUNT_CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'CREDIT', 'DEBIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('FULL', 'STUDENT', 'SOCIAL', 'TEMPORARY', 'HONORARY', 'LIFE');

-- AlterTable
ALTER TABLE "Chargeable" ADD COLUMN     "unitPriceInclTax" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "reference" TEXT,
ALTER COLUMN "invoiceNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "subTotal" DOUBLE PRECISION,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "tax" SET DEFAULT 0.15,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isMember" BOOLEAN DEFAULT true,
ADD COLUMN     "isStaff" BOOLEAN DEFAULT false,
ADD COLUMN     "joinDate" TIMESTAMP(3),
ADD COLUMN     "lastFlight" TIMESTAMP(3),
ADD COLUMN     "memberNumber" TEXT,
ADD COLUMN     "membershipType" "MembershipType",
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photo_url" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "invoiceId" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberAccount" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "memberAccountId" TEXT NOT NULL,
    "paymentId" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_userId_key" ON "MemberAccount"("userId");

-- CreateIndex
CREATE INDEX "MemberAccount_organizationId_idx" ON "MemberAccount"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paymentId_key" ON "Transaction"("paymentId");

-- CreateIndex
CREATE INDEX "Transaction_memberAccountId_idx" ON "Transaction"("memberAccountId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_idx" ON "Transaction"("organizationId");

-- CreateIndex
CREATE INDEX "InvoiceItem_organizationId_idx" ON "InvoiceItem"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberNumber_key" ON "User"("memberNumber");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_memberNumber_idx" ON "User"("memberNumber");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberAccount" ADD CONSTRAINT "MemberAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberAccount" ADD CONSTRAINT "MemberAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_memberAccountId_fkey" FOREIGN KEY ("memberAccountId") REFERENCES "MemberAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
