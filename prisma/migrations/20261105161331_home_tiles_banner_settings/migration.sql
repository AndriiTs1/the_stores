-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "tileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "bannerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerHref" JSONB,
ADD COLUMN     "bannerImageUrl" TEXT;
