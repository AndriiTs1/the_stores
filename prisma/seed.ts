import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { syncDemoCatalog } from "./demo-catalog";
import { demoProductImages } from "./demo-photos";
import { DEMO_SLUG, demoStoreTexts } from "./demo-store";
import { seedRefusal } from "./seed-guard";

// Before connecting: the seed wipes the demo store and must never touch the production database.
const refusal = seedRefusal(process.env);
if (refusal) {
  console.error(`Seed refused: ${refusal}.`);
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type L = { de: string; fr: string; it: string; en: string };

const SIZES = {
  adult: ["S", "M", "L", "XL", "XXL"],
  women: ["XS", "S", "M", "L", "XL"],
  kids: ["116", "128", "140", "152", "164"],
  none: [],
} as const;

// Variants store the German colour; Product.optionValues carries the other languages.
const COLORS: Record<string, Omit<L, "de">> = {
  Schwarz: { fr: "Noir", it: "Nero", en: "Black" },
  Weiss: { fr: "Blanc", it: "Bianco", en: "White" },
  Grau: { fr: "Gris", it: "Grigio", en: "Grey" },
  Rot: { fr: "Rouge", it: "Rosso", en: "Red" },
  Blau: { fr: "Bleu", it: "Blu", en: "Blue" },
  Grün: { fr: "Vert", it: "Verde", en: "Green" },
  Beige: { fr: "Beige", it: "Beige", en: "Beige" },
};

// Made-up demo brands: no real brand names or logos.
const brands = [
  { slug: "muster-basics", name: "Muster Basics" },
  { slug: "muster-sport", name: "Muster Sport" },
  { slug: "muster-outdoor", name: "Muster Outdoor" },
];

const categories: { slug: string; name: L }[] = [
  { slug: "t-shirts", name: { de: "T-Shirts", fr: "T-shirts", it: "T-shirt", en: "T-Shirts" } },
  { slug: "hoodies", name: { de: "Hoodies", fr: "Sweats", it: "Felpe", en: "Hoodies" } },
  { slug: "jacken", name: { de: "Jacken", fr: "Vestes", it: "Giacche", en: "Jackets" } },
  { slug: "hosen", name: { de: "Hosen", fr: "Pantalons", it: "Pantaloni", en: "Trousers" } },
  { slug: "shorts", name: { de: "Shorts", fr: "Shorts", it: "Pantaloncini", en: "Shorts" } },
  { slug: "tops", name: { de: "Tops", fr: "Tops", it: "Top", en: "Tops" } },
  { slug: "accessoires", name: { de: "Accessoires", fr: "Accessoires", it: "Accessori", en: "Accessories" } },
];

// Header navigation.
const collections: { slug: string; name: L; headline?: L; featured?: boolean }[] = [
  { slug: "herren", name: { de: "Herren", fr: "Hommes", it: "Uomo", en: "Men" } },
  { slug: "damen", name: { de: "Damen", fr: "Femmes", it: "Donna", en: "Women" } },
  { slug: "kinder", name: { de: "Kinder", fr: "Enfants", it: "Bambini", en: "Kids" } },
  {
    slug: "sport",
    name: { de: "Sport", fr: "Sport", it: "Sport", en: "Sport" },
    headline: {
      de: "Die Sport-Kollektion",
      fr: "La collection sport",
      it: "La collezione sport",
      en: "The sport collection",
    },
    featured: true,
  },
];

type SeedProduct = {
  slug: string;
  brand: string;
  category: string;
  collections: string[];
  title: L;
  description: L;
  price: number;
  colors: string[];
  sizes: keyof typeof SIZES;
  soldOut?: boolean;
  /** "New" badge on the card. */
  isNew?: boolean;
};

const d = (de: string, fr: string, it: string, en: string): L => ({ de, fr, it, en });

// Newest first: the first product here gets the latest createdAt (the home page order).
const products: SeedProduct[] = [
  {
    slug: "t-shirt-classic",
    brand: "muster-basics",
    category: "t-shirts",
    collections: ["herren", "damen"],
    title: d("T-Shirt Classic", "T-shirt Classic", "T-shirt Classic", "Classic T-Shirt"),
    description: d(
      "Schweres Baumwoll-T-Shirt mit rundem Ausschnitt.",
      "T-shirt épais en coton à col rond.",
      "T-shirt in cotone pesante con girocollo.",
      "Heavy cotton crew-neck T-shirt.",
    ),
    price: 2990,
    colors: ["Schwarz", "Weiss"],
    sizes: "adult",
    isNew: true,
  },
  {
    slug: "windjacke-ridge",
    brand: "muster-outdoor",
    category: "jacken",
    collections: ["herren", "damen"],
    title: d("Windjacke Ridge", "Coupe-vent Ridge", "Giacca a vento Ridge", "Ridge Windbreaker"),
    description: d(
      "Leichte Windjacke mit Kapuze, klein verpackbar.",
      "Coupe-vent léger à capuche, se range dans un petit volume.",
      "Giacca a vento leggera con cappuccio, ripiegabile.",
      "Light hooded windbreaker that packs small.",
    ),
    price: 12990,
    colors: ["Grün"],
    sizes: "adult",
  },
  {
    slug: "leggings-flow",
    brand: "muster-sport",
    category: "hosen",
    collections: ["damen", "sport"],
    title: d("Leggings Flow", "Legging Flow", "Leggings Flow", "Flow Leggings"),
    description: d(
      "Blickdichte Leggings mit hohem Bund.",
      "Legging opaque à taille haute.",
      "Leggings coprenti a vita alta.",
      "Opaque high-waisted leggings.",
    ),
    price: 5990,
    colors: ["Schwarz", "Blau"],
    sizes: "women",
    isNew: true,
  },
  {
    slug: "kinder-hoodie",
    brand: "muster-basics",
    category: "hoodies",
    collections: ["kinder"],
    title: d("Kinder-Hoodie", "Sweat à capuche enfant", "Felpa bambini", "Kids' Hoodie"),
    description: d(
      "Weicher Kapuzenpullover für Kinder.",
      "Sweat à capuche doux pour enfants.",
      "Felpa morbida con cappuccio per bambini.",
      "Soft hooded sweatshirt for kids.",
    ),
    price: 4990,
    colors: ["Rot"],
    sizes: "kids",
  },
  {
    slug: "hoodie-hilltop",
    brand: "muster-basics",
    category: "hoodies",
    collections: ["herren"],
    title: d("Hoodie Hilltop", "Sweat à capuche Hilltop", "Felpa Hilltop", "Hilltop Hoodie"),
    description: d(
      "Warmer Kapuzenpullover mit Kängurutasche.",
      "Sweat chaud à capuche avec poche kangourou.",
      "Felpa calda con cappuccio e tasca a marsupio.",
      "Warm hooded sweatshirt with a kangaroo pocket.",
    ),
    price: 8990,
    colors: ["Grau", "Schwarz"],
    sizes: "adult",
  },
  {
    slug: "sport-top-move",
    brand: "muster-sport",
    category: "tops",
    collections: ["damen", "sport"],
    title: d("Sport-Top Move", "Top de sport Move", "Top sportivo Move", "Move Sports Top"),
    description: d(
      "Sport-Top mit mittlerem Halt.",
      "Top de sport à maintien moyen.",
      "Top sportivo a sostegno medio.",
      "Medium-support sports top.",
    ),
    price: 3990,
    colors: ["Blau"],
    sizes: "women",
  },
  {
    slug: "trainingsjacke",
    brand: "muster-sport",
    category: "jacken",
    collections: ["sport"],
    title: d("Trainingsjacke", "Veste d'entraînement", "Giacca da allenamento", "Training Jacket"),
    description: d(
      "Trainingsjacke mit durchgehendem Reissverschluss.",
      "Veste d'entraînement à fermeture éclair intégrale.",
      "Giacca da allenamento con zip intera.",
      "Full-zip training jacket.",
    ),
    price: 8990,
    colors: ["Blau"],
    sizes: "adult",
  },
  {
    slug: "kinder-t-shirt",
    brand: "muster-basics",
    category: "t-shirts",
    collections: ["kinder"],
    title: d("Kinder-T-Shirt", "T-shirt enfant", "T-shirt bambini", "Kids' T-Shirt"),
    description: d(
      "T-Shirt aus Baumwolle für Kinder.",
      "T-shirt en coton pour enfants.",
      "T-shirt in cotone per bambini.",
      "Cotton T-shirt for kids.",
    ),
    price: 1990,
    colors: ["Blau"],
    sizes: "kids",
  },
  {
    slug: "rashguard-langarm",
    brand: "muster-sport",
    category: "t-shirts",
    collections: ["herren", "sport"],
    title: d("Rashguard Langarm", "Rashguard manches longues", "Rashguard maniche lunghe", "Long Sleeve Rashguard"),
    description: d(
      "Eng anliegendes Langarm-Shirt für Kampfsport.",
      "Haut ajusté à manches longues pour les sports de combat.",
      "Maglia aderente a maniche lunghe per sport da combattimento.",
      "Close-fitting long-sleeve top for combat sports.",
    ),
    price: 6990,
    colors: ["Rot", "Schwarz"],
    sizes: "adult",
  },
  {
    slug: "jogginghose-basic",
    brand: "muster-basics",
    category: "hosen",
    collections: ["herren", "damen"],
    title: d("Jogginghose Basic", "Pantalon de jogging Basic", "Pantaloni da jogging Basic", "Basic Joggers"),
    description: d(
      "Bequeme Jogginghose mit Bündchen.",
      "Pantalon de jogging confortable à bords côtes.",
      "Pantaloni da jogging comodi con polsini.",
      "Comfortable joggers with cuffs.",
    ),
    price: 5990,
    colors: ["Grau"],
    sizes: "adult",
  },
  {
    slug: "laufshirt-damen",
    brand: "muster-sport",
    category: "t-shirts",
    collections: ["damen", "sport"],
    title: d("Laufshirt Damen", "T-shirt de course femme", "Maglia running donna", "Women's Running Shirt"),
    description: d(
      "Leichtes, schnell trocknendes Laufshirt.",
      "T-shirt de course léger à séchage rapide.",
      "Maglia da corsa leggera ad asciugatura rapida.",
      "Light, quick-drying running shirt.",
    ),
    price: 3490,
    colors: ["Rot"],
    sizes: "women",
  },
  {
    slug: "softshell-jacke",
    brand: "muster-outdoor",
    category: "jacken",
    collections: ["herren"],
    title: d("Softshell-Jacke", "Veste softshell", "Giacca softshell", "Softshell Jacket"),
    description: d(
      "Softshell-Jacke für kühle Tage.",
      "Veste softshell pour les journées fraîches.",
      "Giacca softshell per le giornate fresche.",
      "Softshell jacket for cool days.",
    ),
    price: 15990,
    colors: ["Schwarz"],
    sizes: "adult",
    soldOut: true,
  },
  {
    slug: "kapuzenjacke-damen",
    brand: "muster-basics",
    category: "hoodies",
    collections: ["damen"],
    title: d("Kapuzenjacke Damen", "Veste à capuche femme", "Felpa con zip donna", "Women's Zip Hoodie"),
    description: d(
      "Kapuzenjacke mit Reissverschluss.",
      "Veste à capuche zippée.",
      "Felpa con cappuccio e zip.",
      "Zip-up hooded jacket.",
    ),
    price: 7990,
    colors: ["Beige"],
    sizes: "women",
  },
  {
    slug: "kinder-trainerhose",
    brand: "muster-sport",
    category: "hosen",
    collections: ["kinder", "sport"],
    title: d("Kinder-Trainerhose", "Pantalon de survêtement enfant", "Pantaloni tuta bambini", "Kids' Track Pants"),
    description: d(
      "Trainerhose für Kinder mit Gummizug.",
      "Pantalon de survêtement pour enfants à taille élastique.",
      "Pantaloni della tuta per bambini con elastico.",
      "Kids' track pants with an elastic waist.",
    ),
    price: 3990,
    colors: ["Grau"],
    sizes: "kids",
  },
  {
    slug: "shorts-training",
    brand: "muster-sport",
    category: "shorts",
    collections: ["herren", "sport"],
    title: d("Trainingsshorts", "Short d'entraînement", "Pantaloncini da allenamento", "Training Shorts"),
    description: d(
      "Leichte Shorts für das Training.",
      "Short léger pour l'entraînement.",
      "Pantaloncini leggeri per l'allenamento.",
      "Lightweight shorts for training.",
    ),
    price: 4990,
    colors: ["Schwarz"],
    sizes: "adult",
  },
  {
    slug: "beanie-alpin",
    brand: "muster-outdoor",
    category: "accessoires",
    collections: ["herren", "damen", "kinder"],
    title: d("Beanie Alpin", "Bonnet Alpin", "Berretto Alpin", "Alpin Beanie"),
    description: d(
      "Strickmütze mit Bommel, eine Grösse.",
      "Bonnet tricoté à pompon, taille unique.",
      "Berretto in maglia con pompon, taglia unica.",
      "Knitted bobble beanie, one size.",
    ),
    price: 2490,
    colors: ["Schwarz", "Rot"],
    sizes: "none",
  },
];

/** Demo stock: the largest size is always sold out, every third product also its smallest. */
function stockFor(p: SeedProduct, index: number, size: string | null, si: number, sizeCount: number) {
  if (p.soldOut) return 0;
  if (size && si === sizeCount - 1) return 0;
  if (size && si === 0 && index % 3 === 0) return 0;
  return 3 + ((index + si) % 5);
}

async function main() {
  await db.store.deleteMany({ where: { slug: DEMO_SLUG } });

  // Trust-strip settings (returnDays, originalGoods, paymentMethods) stay unset: the demo makes no promises.
  const store = await db.store.create({
    data: {
      slug: DEMO_SLUG,
      ...demoStoreTexts,
      contactEmail: "shop@example.ch",
      locations: { create: [{ name: "Lager Lugano", type: "WAREHOUSE" }] },
      sellers: { create: [{ slug: "house", name: demoStoreTexts.name, type: "HOUSE", status: "ACTIVE" }] },
      categories: { create: categories.map((c, i) => ({ slug: c.slug, name: c.name, position: i })) },
      brands: { create: brands.map((b, i) => ({ ...b, position: i })) },
      collections: {
        create: collections.map((c, i) => ({
          slug: c.slug,
          name: c.name,
          headline: c.headline,
          position: i,
          inNav: true,
          featured: c.featured ?? false,
        })),
      },
    },
    include: { locations: true, categories: true, brands: true, collections: true, sellers: true },
  });

  const warehouse = store.locations[0];
  const now = Date.now();

  for (const [index, p] of products.entries()) {
    const sizes: readonly string[] = SIZES[p.sizes];
    const sizeList = sizes.length ? sizes : [null];
    const variants = p.colors.flatMap((color, ci) =>
      sizeList.map((size, si) => ({
        sku: [p.slug, color, size].filter(Boolean).join("-").toUpperCase(),
        price: p.price,
        // Former prices (and their kind) are set by syncDemoCatalog below.
        options: size ? { size, color } : { color },
        position: ci * 10 + si,
        inventory: {
          create: { locationId: warehouse.id, quantity: stockFor(p, index, size, si, sizeList.length) },
        },
      })),
    );

    await db.product.create({
      data: {
        storeId: store.id,
        sellerId: store.sellers[0].id, // the store itself (HOUSE)
        categoryId: store.categories.find((c) => c.slug === p.category)?.id,
        brandId: store.brands.find((b) => b.slug === p.brand)?.id,
        collections: {
          connect: store.collections.filter((c) => p.collections.includes(c.slug)).map((c) => ({ id: c.id })),
        },
        slug: p.slug,
        title: p.title,
        description: p.description,
        status: "ACTIVE",
        ...demoProductImages(p.slug), // Unsplash photos (prisma/demo-photos.ts)
        optionNames: sizes.length ? ["size", "color"] : ["color"],
        optionValues: { color: Object.fromEntries(p.colors.map((c) => [c, COLORS[c]])) },
        isNew: p.isNew ?? false,
        createdAt: new Date(now - index * 60_000),
        variants: { create: variants },
      },
    });
  }

  // Lines, former prices, the private seller and her second-hand items (shared with db:update-demo).
  const synced = await syncDemoCatalog(db, store.id, store.name);
  console.log(`Seeded store "${store.name}" with ${products.length + synced.preloved} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
