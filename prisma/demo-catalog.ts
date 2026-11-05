import type { PrismaClient } from "../src/generated/prisma/client";
import { checkProductRules } from "../src/lib/product-rules";
import { demoProductImages } from "./demo-photos";

/**
 * The demo store's sellers, product lines, former prices and its second-hand items. Used by the seed (after it has
 * created the products) and by db:update-demo (on an existing store): updates and upserts only, safe to run again.
 */
type L = { de: string; fr: string; it: string; en: string };
const d = (de: string, fr: string, it: string, en: string): L => ({ de, fr, it, en });

/** Outlet items and their former price (Rappen); every other house product is NEW. */
const OUTLET: Record<string, number> = {
  "windjacke-ridge": 14990,
  "hoodie-hilltop": 10990,
  trainingsjacke: 10990,
  "jogginghose-basic": 7990,
  "laufshirt-damen": 4490,
  "softshell-jacke": 19990,
};

/** A NEW product with a short promotion price: for the «only reduced» filter across lines. */
const PROMO: Record<string, number> = { "t-shirt-classic": 3490 };

/** A made-up private seller. */
export const DEMO_PRIVATE_SELLER = { slug: "anna-lugano", name: "Anna, Lugano" };

const PRELOVED: {
  slug: string;
  title: L;
  description: L;
  category: string;
  collections: string[];
  price: number;
  condition: "NEW_WITH_TAGS" | "LIKE_NEW" | "VERY_GOOD" | "GOOD";
  size: string | null;
  color: string;
  colorLabel: Omit<L, "de">;
}[] = [
  {
    slug: "jeansjacke-anna",
    title: d("Jeansjacke mit Teddykragen", "Veste en jean à col sherpa", "Giacca di jeans con collo teddy", "Denim jacket with sherpa collar"),
    description: d(
      "Helle Jeansjacke, zwei Saisons getragen, ohne Flecken.",
      "Veste en jean claire, portée deux saisons, sans taches.",
      "Giacca di jeans chiara, indossata due stagioni, senza macchie.",
      "Light denim jacket, worn for two seasons, no stains.",
    ),
    category: "jacken",
    collections: ["damen"],
    price: 4500,
    condition: "VERY_GOOD",
    size: "M",
    color: "Blau",
    colorLabel: { fr: "Bleu", it: "Blu", en: "Blue" },
  },
  {
    slug: "hoodie-anna",
    title: d("Hoodie Weiss", "Sweat à capuche blanc", "Felpa con cappuccio bianca", "White hoodie"),
    description: d(
      "Weicher Baumwoll-Hoodie, zweimal getragen.",
      "Sweat en coton doux, porté deux fois.",
      "Felpa morbida in cotone, indossata due volte.",
      "Soft cotton hoodie, worn twice.",
    ),
    category: "hoodies",
    collections: ["damen"],
    price: 2500,
    condition: "LIKE_NEW",
    size: "S",
    color: "Weiss",
    colorLabel: { fr: "Blanc", it: "Bianco", en: "White" },
  },
  {
    slug: "jeans-anna",
    title: d("Slim-Jeans", "Jean slim", "Jeans slim", "Slim jeans"),
    description: d(
      "Dunkelblaue Slim-Jeans, Saum leicht abgetragen.",
      "Jean slim bleu foncé, ourlet légèrement usé.",
      "Jeans slim blu scuro, orlo leggermente consumato.",
      "Dark blue slim jeans, hem slightly worn.",
    ),
    category: "hosen",
    collections: ["herren"],
    price: 3500,
    condition: "GOOD",
    size: "L",
    color: "Blau",
    colorLabel: { fr: "Bleu", it: "Blu", en: "Blue" },
  },
  {
    slug: "ledertasche-anna",
    title: d("Ledertasche Cognac", "Sac en cuir cognac", "Borsa in pelle cognac", "Cognac leather bag"),
    description: d(
      "Henkeltasche aus Leder, nie benutzt, mit Etikett.",
      "Sac à anses en cuir, jamais utilisé, avec étiquette.",
      "Borsa a mano in pelle, mai usata, con etichetta.",
      "Leather handbag, never used, tags attached.",
    ),
    category: "accessoires",
    collections: ["damen"],
    price: 8900,
    condition: "NEW_WITH_TAGS",
    size: null,
    color: "Braun",
    colorLabel: { fr: "Marron", it: "Marrone", en: "Brown" },
  },
];

export async function syncDemoCatalog(db: PrismaClient, storeId: string, storeName: string) {
  // Sellers: the store itself, and the private seller.
  const house = await db.seller.upsert({
    where: { storeId_slug: { storeId, slug: "house" } },
    update: { name: storeName, type: "HOUSE", status: "ACTIVE" },
    create: { storeId, slug: "house", name: storeName, type: "HOUSE", status: "ACTIVE" },
  });
  const anna = await db.seller.upsert({
    where: { storeId_slug: { storeId, slug: DEMO_PRIVATE_SELLER.slug } },
    update: { name: DEMO_PRIVATE_SELLER.name, type: "PRIVATE", status: "ACTIVE" },
    create: { storeId, ...DEMO_PRIVATE_SELLER, type: "PRIVATE", status: "ACTIVE" },
  });

  // House products: Outlet with their former price, a NEW promotion, the rest NEW without one.
  const products = await db.product.findMany({ where: { storeId, sellerId: house.id }, select: { id: true, slug: true } });
  const since = new Date("2026-10-01T00:00:00Z");
  for (const p of products) {
    const outlet = OUTLET[p.slug];
    const former = outlet ?? PROMO[p.slug] ?? null;
    const line = outlet ? "OUTLET" : "NEW";
    checkProductRules({ sellerType: "HOUSE", line, condition: null });
    await db.product.update({ where: { id: p.id }, data: { line, condition: null } });
    await db.productVariant.updateMany({
      where: { productId: p.id },
      data: former
        ? { compareAtPrice: former, compareAtPriceType: "OUR_PREVIOUS", compareAtPriceSince: since }
        : { compareAtPrice: null, compareAtPriceType: null, compareAtPriceSince: null },
    });
  }

  // Second-hand items of the private seller: one piece each.
  const [location, categories, collections] = await Promise.all([
    db.location.findFirst({ where: { storeId, sellsOnline: true } }),
    db.category.findMany({ where: { storeId } }),
    db.collection.findMany({ where: { storeId } }),
  ]);
  if (!location) throw new Error("The demo store has no online location");
  for (const [i, item] of PRELOVED.entries()) {
    checkProductRules({ sellerType: "PRIVATE", line: "PRELOVED", condition: item.condition });
    const data = {
      sellerId: anna.id,
      line: "PRELOVED" as const,
      condition: item.condition,
      categoryId: categories.find((c) => c.slug === item.category)?.id ?? null,
      title: item.title,
      description: item.description,
      status: "ACTIVE" as const,
      ...demoProductImages(item.slug),
      optionNames: item.size ? ["size", "color"] : ["color"],
      optionValues: { color: { [item.color]: item.colorLabel } },
      collections: { set: collections.filter((c) => item.collections.includes(c.slug)).map((c) => ({ id: c.id })) },
    };
    const existing = await db.product.findUnique({ where: { storeId_slug: { storeId, slug: item.slug } } });
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data });
      await db.productVariant.updateMany({ where: { productId: existing.id }, data: { price: item.price } });
    } else {
      await db.product.create({
        data: {
          ...data,
          storeId,
          slug: item.slug,
          collections: { connect: data.collections.set },
          createdAt: new Date(Date.now() - i * 60_000 + 3_600_000), // the newest products of the store
          variants: {
            create: {
              sku: `${item.slug}-1`.toUpperCase(),
              price: item.price,
              options: item.size ? { size: item.size, color: item.color } : { color: item.color },
              inventory: { create: { locationId: location.id, quantity: 1 } },
            },
          },
        },
      });
    }
  }
  return { house: products.length, preloved: PRELOVED.length };
}
