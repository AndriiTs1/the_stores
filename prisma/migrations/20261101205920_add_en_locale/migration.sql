-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "optionValues" JSONB;

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "locales" SET DEFAULT ARRAY['de', 'fr', 'it', 'en']::TEXT[];

-- Existing stores get English as an additional storefront language.
UPDATE "Store" SET "locales" = array_append("locales", 'en') WHERE NOT ('en' = ANY("locales"));
