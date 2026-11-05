-- Product lines (Outlet, Neu, Second Story) and sellers. Adds only: nothing is dropped (removals get their own
-- migration after the code that stops using a column is live). Hand-edited after `prisma migrate dev --create-only`:
-- the seller is added in three steps, existing rows are backfilled, and the checks and triggers are added (Prisma
-- doesn't manage CHECK constraints or triggers, so they don't show up as drift).

-- 1. Types
CREATE TYPE "ProductLine" AS ENUM ('NEW', 'OUTLET', 'PRELOVED');
CREATE TYPE "ItemCondition" AS ENUM ('NEW_WITH_TAGS', 'LIKE_NEW', 'VERY_GOOD', 'GOOD');
CREATE TYPE "SellerType" AS ENUM ('HOUSE', 'BRAND', 'SHOP', 'PRIVATE');
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'BLOCKED');
CREATE TYPE "CompareAtPriceType" AS ENUM ('OUR_PREVIOUS', 'MANUFACTURER_RRP');

-- 2. Sellers
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "SellerType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "SellerStatus" NOT NULL DEFAULT 'PENDING',
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Seller_storeId_type_idx" ON "Seller"("storeId", "type");
CREATE UNIQUE INDEX "Seller_storeId_slug_key" ON "Seller"("storeId", "slug");
CREATE UNIQUE INDEX "Seller_id_storeId_key" ON "Seller"("id", "storeId");
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Product: line (NEW for every existing row), condition, seller — step 1 of 3: the seller column nullable
ALTER TABLE "Product" ADD COLUMN "condition" "ItemCondition",
ADD COLUMN "line" "ProductLine" NOT NULL DEFAULT 'NEW',
ADD COLUMN "sellerId" TEXT;

-- 4. Step 2 of 3: one HOUSE seller per store (slug "house", the store's name), given to all its products
INSERT INTO "Seller" ("id", "storeId", "type", "name", "slug", "status")
SELECT gen_random_uuid()::text, s."id", 'HOUSE', s."name", 'house', 'ACTIVE'
FROM "Store" s
ON CONFLICT ("storeId", "slug") DO NOTHING;

UPDATE "Product" p
SET "sellerId" = sl."id"
FROM "Seller" sl
WHERE sl."storeId" = p."storeId" AND sl."slug" = 'house' AND p."sellerId" IS NULL;

-- 5. Step 3 of 3: required, and the seller must belong to the product's store
ALTER TABLE "Product" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_storeId_fkey" FOREIGN KEY ("sellerId", "storeId") REFERENCES "Seller"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Existing products: a former price → OUTLET, the rest stays NEW
UPDATE "Product" p SET "line" = 'OUTLET'
WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id" AND v."compareAtPrice" IS NOT NULL);

-- 7. A condition exactly for PRELOVED items
ALTER TABLE "Product" ADD CONSTRAINT "Product_condition_preloved_check"
  CHECK (("line" = 'PRELOVED') = ("condition" IS NOT NULL));

-- 8. Former price: its kind (existing ones: our previous price) and since when; the kind is set exactly with a price
ALTER TABLE "ProductVariant" ADD COLUMN "compareAtPriceSince" TIMESTAMP(3),
ADD COLUMN "compareAtPriceType" "CompareAtPriceType";
UPDATE "ProductVariant" SET "compareAtPriceType" = 'OUR_PREVIOUS' WHERE "compareAtPrice" IS NOT NULL;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_compareAtPriceType_check"
  CHECK (("compareAtPrice" IS NULL) = ("compareAtPriceType" IS NULL));

-- 9. Indexes
CREATE INDEX "Product_storeId_line_status_createdAt_idx" ON "Product"("storeId", "line", "status", "createdAt");
CREATE INDEX "Product_storeId_sellerId_idx" ON "Product"("storeId", "sellerId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- 10. A private seller sells only PRELOVED: on a product write, and when a seller becomes PRIVATE
CREATE FUNCTION "product_private_seller_preloved"() RETURNS trigger AS $$
BEGIN
  IF NEW."line" <> 'PRELOVED'
     AND EXISTS (SELECT 1 FROM "Seller" s WHERE s."id" = NEW."sellerId" AND s."type" = 'PRIVATE') THEN
    RAISE EXCEPTION 'A private seller sells only PRELOVED items (product %)', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER "product_private_seller_preloved"
  BEFORE INSERT OR UPDATE OF "line", "sellerId" ON "Product"
  FOR EACH ROW EXECUTE FUNCTION "product_private_seller_preloved"();

CREATE FUNCTION "seller_private_only_preloved"() RETURNS trigger AS $$
BEGIN
  IF NEW."type" = 'PRIVATE'
     AND EXISTS (SELECT 1 FROM "Product" p WHERE p."sellerId" = NEW."id" AND p."line" <> 'PRELOVED') THEN
    RAISE EXCEPTION 'Seller % has non-PRELOVED products and cannot become PRIVATE', NEW."id"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER "seller_private_only_preloved"
  BEFORE UPDATE OF "type" ON "Seller"
  FOR EACH ROW EXECUTE FUNCTION "seller_private_only_preloved"();
