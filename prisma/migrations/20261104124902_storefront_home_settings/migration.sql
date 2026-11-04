-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "announcement" JSONB,
ADD COLUMN     "announcementHref" TEXT,
ADD COLUMN     "bannerEyebrow" JSONB,
ADD COLUMN     "bannerText" JSONB,
ADD COLUMN     "bannerTitle" JSONB;
