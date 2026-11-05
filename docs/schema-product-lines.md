# Product lines and sellers: schema proposal (step A)

Status: **proposal, not applied.** No migration file, no code change, nothing run against any database. Waiting for an «ok».

Goal of the data change: every product belongs to one of three **lines** — Outlet, Neu, Second Story — and to one **seller** (the store itself, a brand, an outlet shop, a private person). The storefront work (line switcher `?line=`, Outlet instead of Sale, `/sale` → 301 `/outlet`, categories as the item type) comes in later steps.

## 1. What the current schema already has

| Question | Finding |
|---|---|
| Where is the former («crossed out») price? | On the **variant**: `ProductVariant.compareAtPrice Int?` (Rappen), next to `price`. A product is «on sale» when any variant has one (`ON_SALE` in `src/lib/catalog.ts`). |
| Brand vs. seller | `Brand` is a per-store entity (`storeId`, `@@unique([storeId, slug])`), linked from `Product.brandId` (optional, `onDelete: SetNull`). It has no notion of who sells. A separate `Seller` can therefore sell any brand: a FoxTown shop (seller, type SHOP) selling Pitbull (brand) is `Product { sellerId: <shop>, brandId: <Pitbull> }`. **No change to `Brand` needed.** |
| Item condition, line, seller | None exist. `Product.isNew` exists (the old «Neu» badge, no longer shown). |
| Tenancy | Every product has `storeId`; sellers must be per store too. |

On the dev database (read-only count, demo store, all products ACTIVE): **14 → NEW, 2 → OUTLET** (the two with a former price). No product mixes reduced and not-reduced variants. Production was not queried.

## 2. Prisma schema (diff)

```diff
+enum ProductLine {
+  NEW
+  OUTLET
+  PRELOVED // shown as «Second Story» (translations only)
+}
+
+enum ItemCondition {
+  NEW_WITH_TAGS
+  LIKE_NEW
+  VERY_GOOD
+  GOOD
+}
+
+enum SellerType {
+  HOUSE   // the store itself
+  BRAND   // a brand selling its own goods
+  SHOP    // an outlet / retail shop
+  PRIVATE // a private person: PRELOVED only
+}
+
+enum SellerStatus {
+  ACTIVE
+  PAUSED // products hidden from the storefront, kept in the database (see question 1)
+}
+
+enum CompareAtPriceType {
+  OUR_PREVIOUS     // our own earlier price
+  MANUFACTURER_RRP // the manufacturer's recommended retail price
+}
+
 model Store {
   …
+  sellers     Seller[]
 }
+
+model Seller {
+  id        String       @id @default(cuid())
+  storeId   String
+  store     Store        @relation(fields: [storeId], references: [id], onDelete: Cascade)
+  type      SellerType
+  name      String
+  slug      String
+  status    SellerStatus @default(ACTIVE)
+  createdAt DateTime     @default(now())
+  products  Product[]
+
+  @@unique([storeId, slug])
+  @@unique([id, storeId]) // target of Product's (sellerId, storeId) key: a product's seller is in the same store
+  @@index([storeId, type])
+}

 model Product {
   id           String        @id @default(cuid())
   storeId      String
   store        Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
+  sellerId     String
+  seller       Seller        @relation(fields: [sellerId, storeId], references: [id, storeId], onDelete: Restrict)
+  line         ProductLine   @default(NEW)
+  condition    ItemCondition? // PRELOVED only; the database checks line = PRELOVED ⇔ condition set
   categoryId   String?
   …
   @@unique([storeId, slug])
   @@index([storeId, status, createdAt])
+  @@index([storeId, line, status, createdAt]) // the storefront: one line, active, newest first
+  @@index([storeId, sellerId])
+  @@index([categoryId])                       // the item-type filter (subcategory, first Filter group)
   @@index([brandId])
 }

 model ProductVariant {
   …
   compareAtPrice Int?
+  compareAtPriceType CompareAtPriceType? // set exactly when compareAtPrice is set (database check)
   …
 }
```

Notes:

- **`(sellerId, storeId)` as a composite key** to `Seller(id, storeId)` makes «seller of another store» impossible in the database, not only in code. Prisma supports a scalar (`storeId`) in two relations. Brand and category don't have this guard today (see risk 6).
- `onDelete: Restrict` on the seller: a seller with products can't be deleted by accident; pause it instead.
- The two CHECKs and the trigger (below) are not expressible in the Prisma schema. They live in the migration SQL; Prisma doesn't manage them and doesn't try to drop them. This has to be confirmed on dev when the migration is generated (`prisma migrate dev` must report no drift afterwards).

## 3. SQL migration (draft, one file)

Generated with `prisma migrate dev --create-only`, then edited by hand for the backfill, the checks and the trigger. Order inside the file:

```sql
-- 1. Types
CREATE TYPE "ProductLine" AS ENUM ('NEW', 'OUTLET', 'PRELOVED');
CREATE TYPE "ItemCondition" AS ENUM ('NEW_WITH_TAGS', 'LIKE_NEW', 'VERY_GOOD', 'GOOD');
CREATE TYPE "SellerType" AS ENUM ('HOUSE', 'BRAND', 'SHOP', 'PRIVATE');
CREATE TYPE "SellerStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "CompareAtPriceType" AS ENUM ('OUR_PREVIOUS', 'MANUFACTURER_RRP');

-- 2. Sellers
CREATE TABLE "Seller" (
  "id"        TEXT NOT NULL,
  "storeId"   TEXT NOT NULL,
  "type"      "SellerType" NOT NULL,
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "status"    "SellerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Seller_storeId_slug_key" ON "Seller"("storeId", "slug");
CREATE UNIQUE INDEX "Seller_id_storeId_key" ON "Seller"("id", "storeId");
CREATE INDEX "Seller_storeId_type_idx" ON "Seller"("storeId", "type");
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Product: line and condition (line defaults to NEW for every existing row)
ALTER TABLE "Product"
  ADD COLUMN "line" "ProductLine" NOT NULL DEFAULT 'NEW',
  ADD COLUMN "condition" "ItemCondition",
  ADD COLUMN "sellerId" TEXT;                      -- step 1 of 3: nullable

-- 4. Step 2 of 3: one HOUSE seller per store, assigned to all its products
INSERT INTO "Seller" ("id", "storeId", "type", "name", "slug", "status")
SELECT gen_random_uuid()::text, s."id", 'HOUSE', s."name", 'house', 'ACTIVE'
FROM "Store" s
ON CONFLICT ("storeId", "slug") DO NOTHING;

UPDATE "Product" p
SET "sellerId" = sl."id"
FROM "Seller" sl
WHERE sl."storeId" = p."storeId" AND sl."slug" = 'house' AND p."sellerId" IS NULL;

-- 5. Step 3 of 3: required, same-store foreign key
ALTER TABLE "Product" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_storeId_fkey"
  FOREIGN KEY ("sellerId", "storeId") REFERENCES "Seller"("id", "storeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Lines of existing products: a former price → OUTLET, the rest stays NEW
UPDATE "Product" p SET "line" = 'OUTLET'
WHERE EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id" AND v."compareAtPrice" IS NOT NULL);

-- 7. Condition only for PRELOVED, and always for PRELOVED
ALTER TABLE "Product" ADD CONSTRAINT "Product_condition_preloved_check"
  CHECK (("line" = 'PRELOVED') = ("condition" IS NOT NULL));

-- 8. Kind of the former price: set exactly when there is one (existing ones: see question 4)
ALTER TABLE "ProductVariant" ADD COLUMN "compareAtPriceType" "CompareAtPriceType";
UPDATE "ProductVariant" SET "compareAtPriceType" = 'OUR_PREVIOUS' WHERE "compareAtPrice" IS NOT NULL;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_compareAtPriceType_check"
  CHECK (("compareAtPrice" IS NULL) = ("compareAtPriceType" IS NULL));

-- 9. Indexes
CREATE INDEX "Product_storeId_line_status_createdAt_idx" ON "Product"("storeId", "line", "status", "createdAt");
CREATE INDEX "Product_storeId_sellerId_idx" ON "Product"("storeId", "sellerId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- 10. (If agreed, question 3) A private seller sells only PRELOVED
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
```

The file is idempotent only as a whole migration (Prisma runs it once and records it). The backfill statements themselves are safe to repeat: `ON CONFLICT DO NOTHING`, `WHERE "sellerId" IS NULL`.

## 4. Rule «PRIVATE sells only PRELOVED»

- **In code, always:** a pure check, for example `sellerMaySell(sellerType, line)` in `src/lib/product-rules.ts`. Every path that creates or edits a product calls it: today the seed and the admin product form; later the seller portal and imports. It is covered by a unit test and gives a readable error in the right language.
- **In the database, my recommendation: yes, the two triggers above.** Products will come from several paths (admin, seller portal, CSV/feed import, scripts), and a CHECK can't look at another table. The trigger costs one indexed lookup per product write, and it also covers the reverse case: a seller with new or outlet goods being changed to PRIVATE. It is a last line of defence, not the user-facing message; the code check stays the source of messages.
- The `condition ⇔ PRELOVED` rule is a plain CHECK on one row, so it needs no trigger.

## 5. Former price and Swiss price rules (PBV)

- `compareAtPriceType` sits on the **variant**, next to `compareAtPrice`, because the former price is per variant today.
- The CHECK makes the type mandatory exactly when a former price exists. Without a type, the storefront could not label the crossed-out price correctly («statt» / «UVP»). The legal check under the Preisbekanntgabeverordnung comes later.
- Not proposed now, but likely needed for PBV: the date from which a former price was charged, so the storefront can tell how long an «our previous price» comparison may be shown. That would be a separate field later (question 5).

## 6. Data migration plan

1. **dev:** generate the migration (`--create-only`), add the hand-written parts and apply them. Check:
   - `prisma migrate status` is clean;
   - `migrate dev` shows no drift;
   - line counts: dev today gives 14 NEW and 2 OUTLET;
   - every product has the store's HOUSE seller;
   - inserting a PRELOVED product without a condition fails;
   - a PRIVATE seller with a NEW product fails.
2. **Code, same PR:**
   - the seed sets `sellerId` (HOUSE), `line` and `compareAtPriceType`; after the migration, creating a product without `sellerId` fails;
   - `db:update-demo` sets lines and types on existing demo rows idempotently;
   - the product rule from section 4 with its test.
3. **preview:** `db:deploy`, then the same checks, then the preview deployment.
4. **Production, only after an «ok»:**
   - `db:deploy` first: the new columns have defaults, and the old code doesn't write products;
   - check that the old site still answers 200;
   - merge and deploy;
   - then `db:update-demo` if needed.
   - Read-only count before applying: how many products become OUTLET.
5. **Rollback:** a down-migration script, kept with the PR. It drops the triggers, checks, indexes, FK and columns, the table and the types in reverse order. Data in the new columns is lost on rollback; line and seller are fully derivable from the old data, so that is acceptable.

## 7. Where the code reads products (where `line` will be added later)

All listed places are scoped to the store. ✓ = `storeId` checked directly or through a store-scoped parent.

| Place | Reads | Store scope | Line filter later |
|---|---|---|---|
| `src/lib/catalog.ts` → `getProductCards` | home grid, search results, wishlist cards | ✓ `storeId` + `status` | yes |
| `src/lib/catalog.ts` → `hasSale` | Sale tile/menu rule | ✓ | becomes «has OUTLET» |
| `src/lib/catalog.ts` → `searchProductIds` (raw SQL) | search | ✓ `p."storeId" = …` | yes (or via `getProductCards`) |
| `src/lib/listing.ts` → `getListing` (2 queries) | collection, category, brand, Sale, all products | ✓ `scope` adds `storeId` + `status` | yes; facets too |
| `src/app/s/[site]/[locale]/page.tsx` | home grid (via `getProductCards`), categories and brands «with products» (`products: { some: { status } }`) | ✓ via `category.storeId` / `brand.storeId` | yes, in the `some` |
| `src/app/s/[site]/[locale]/categories/page.tsx` | sale count, collections with products, categories per collection | ✓ `active = { storeId, status }` | yes |
| `src/app/s/[site]/[locale]/search/page.tsx` | search (catalog functions) | ✓ | yes |
| `src/app/s/[site]/[locale]/wishlist/actions.ts` | saved products by id | ✓ via `getProductCards(store.id…)` | no (show what was saved), maybe a line badge |
| `src/app/s/[site]/[locale]/p/[slug]/page.tsx` | product page | ✓ `storeId_slug` | no (a product page shows any line); the line decides labels (condition, seller) |
| `src/app/s/[site]/[locale]/p/[slug]/opengraph-image.tsx` | product link preview | ✓ `storeId_slug` | no; condition and «Second Story» on the image later |
| `src/app/s/[site]/[locale]/opengraph-image.tsx` | store link preview (first products) | ✓ `storeId` + `status` | Outlet first (the default line) |
| `src/app/s/[site]/[locale]/actions.ts` → add to cart | variant by id | ✓ `product: { storeId, status }` | no |
| `src/lib/cart.ts` | cart lines | ✓ `product: { storeId, status }` | no |
| `src/lib/orders.ts` | stock reserve / release by variant | variants come from the store-checked cart; release uses `order.storeId` | no |
| `src/app/s/[site]/admin/**` (list, detail, save, dashboard count) | admin | ✓ `storeId` everywhere | admin list: a line column and filter |
| `src/app/s/[site]/[locale]/layout.tsx` | `hasSale` for the menu | ✓ | becomes Outlet |
| **sitemap** | — | **does not exist yet** | when it is added: per line, store-scoped |

No product read without a store scope was found. The demo seed (`prisma/seed.ts`) and `prisma/update-demo.ts` write by store slug.

## 8. Risks

1. **Deploy order.** After the migration, every product insert needs `sellerId`. Only the seed creates products today, so the old storefront and admin keep working. The seed must change in the same PR, and it must not run on Production (the seed guard already refuses).
2. **Sale ≠ Outlet afterwards.** Today «Sale» means «has a former price». After the backfill they coincide. Later a NEW product could get a former price (a short promotion) and an OUTLET product could have none. The storefront step must decide what Outlet shows (question 2).
3. **Hand-written SQL Prisma doesn't see** (2 CHECKs, 2 triggers). It is safe if `migrate dev` stays drift-free; to be confirmed on dev. Future `migrate dev` runs must not be pointed at a database where someone dropped them.
4. **`gen_random_uuid()` ids** for the HOUSE sellers differ in format from Prisma's cuids. That is harmless (ids are opaque `TEXT`), but visible in admin URLs.
5. **Unknown Production numbers.** The dev counts above are demo data; Production was not queried.
6. **Cross-store references** are not enforced for brand, category and collection: a product could in theory point at another store's brand. The seller gets a composite key now; brand and category could get the same later.
7. **Variant JSON filters** (size and colour in `ProductVariant.options`) have no index. That is fine at demo size. With thousands of products a GIN or expression index is needed, and Prisma can't declare an expression index (it would show as drift), so that needs its own decision later.
8. **PRELOVED stock.** Second-hand items are usually unique (quantity 1). The current inventory model fits, but «sold» then means stock 0. Reservations and abandoned checkouts matter more for a one-off item.

## 9. Questions for you

1. **Seller status:** is `ACTIVE` / `PAUSED` enough? Or do you also need `PENDING` (a private seller waiting for approval) and `BLOCKED`?
2. **Outlet vs. former price:** may a NEW product carry a former price (a promotion), or does a former price always mean OUTLET? Can an OUTLET product be without a former price (outlet stock at a normal price)?
3. **Triggers in the database** for «PRIVATE ⇒ PRELOVED»: yes (my recommendation), or code only?
4. **Existing former prices:** mark them `OUR_PREVIOUS` in the backfill, or `MANUFACTURER_RRP`, or something to decide per product?
5. **PBV:** shall we plan a «former price since» date next to the type now, or after the legal check?
6. **HOUSE seller:** slug `house`, name = store name, OK? Should it be shown on the storefront («Verkauft von The Stores»)?
7. **A BRAND seller and a Brand:** should a seller of type BRAND link to its `Brand` (optional `Seller.brandId`), or stay independent?
8. **`Product.isNew`:** it no longer has a badge and is now confusable with the NEW line. Drop it in this migration, or keep it?
9. **Condition for PRELOVED** sits on the product (one item), not on variants. OK?
