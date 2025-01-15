-- CreateEnum
CREATE TYPE "LicenceType" AS ENUM ('PPL_A', 'PPL_H', 'CPL_A', 'CPL_H', 'ATP');

-- CreateTable
CREATE TABLE "member_number_sequences" (
    "organizationId" TEXT NOT NULL,
    "last_number" INTEGER DEFAULT 0,

    CONSTRAINT "member_number_sequences_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "UserPilotDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caaClientNumber" TEXT,
    "licenceType" "LicenceType",
    "typeRatings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "class1Expiry" TIMESTAMP(3),
    "class2Expiry" TIMESTAMP(3),
    "dl9Expiry" TIMESTAMP(3),
    "bfrExpiry" TIMESTAMP(3),
    "endorsements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primeRatings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPilotDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPilotDetails_userId_key" ON "UserPilotDetails"("userId");

-- CreateIndex
CREATE INDEX "UserPilotDetails_userId_idx" ON "UserPilotDetails"("userId");

-- AddForeignKey
ALTER TABLE "UserPilotDetails" ADD CONSTRAINT "UserPilotDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
