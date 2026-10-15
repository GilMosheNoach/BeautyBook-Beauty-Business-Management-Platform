-- One portrait per business. Kept apart from the enum change because a new enum value
-- can't be used in the transaction that adds it.
CREATE UNIQUE INDEX "Image_one_about_per_business" ON "Image"("businessId") WHERE "kind" = 'ABOUT';
