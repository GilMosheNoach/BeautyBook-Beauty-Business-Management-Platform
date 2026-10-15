-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('COVER', 'GALLERY', 'SERVICE');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" "ImageKind" NOT NULL,
    "serviceId" TEXT,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_serviceId_key" ON "Image"("serviceId");

-- CreateIndex
CREATE INDEX "Image_businessId_kind_sortOrder_idx" ON "Image"("businessId", "kind", "sortOrder");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most one cover photo per business (Prisma can't express a partial index).
CREATE UNIQUE INDEX "Image_one_cover_per_business" ON "Image"("businessId") WHERE "kind" = 'COVER';
