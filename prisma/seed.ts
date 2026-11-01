import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type L = { de: string; fr: string; it: string; en: string };

const SIZES = ["S", "M", "L", "XL", "XXL"];

// Variants store the German colour; Product.optionValues carries the other languages.
const COLORS: Record<string, Omit<L, "de">> = {
  Schwarz: { fr: "Noir", it: "Nero", en: "Black" },
  Weiss: { fr: "Blanc", it: "Bianco", en: "White" },
  Grau: { fr: "Gris", it: "Grigio", en: "Grey" },
  Rot: { fr: "Rouge", it: "Rosso", en: "Red" },
};

const products: {
  slug: string;
  category: string;
  title: L;
  description: L;
  price: number;
  compareAt?: number;
  colors: string[];
}[] = [
  {
    slug: "t-shirt-classic-logo",
    category: "t-shirts",
    title: {
      de: "T-Shirt Classic Logo",
      fr: "T-shirt Classic Logo",
      it: "T-shirt Classic Logo",
      en: "T-Shirt Classic Logo",
    },
    description: {
      de: "Schweres Baumwoll-T-Shirt mit klassischem Logo-Print.",
      fr: "T-shirt épais en coton avec logo classique imprimé.",
      it: "T-shirt in cotone pesante con stampa logo classica.",
      en: "Heavy cotton T-shirt with a classic logo print.",
    },
    price: 3990,
    colors: ["Schwarz", "Weiss"],
  },
  {
    slug: "hoodie-hilltop",
    category: "hoodies",
    title: { de: "Hoodie Hilltop", fr: "Sweat à capuche Hilltop", it: "Felpa Hilltop", en: "Hilltop Hoodie" },
    description: {
      de: "Warmer Kapuzenpullover mit Kängurutasche.",
      fr: "Sweat chaud à capuche avec poche kangourou.",
      it: "Felpa calda con cappuccio e tasca a marsupio.",
      en: "Warm hooded sweatshirt with a kangaroo pocket.",
    },
    price: 8990,
    compareAt: 10990,
    colors: ["Schwarz", "Grau"],
  },
  {
    slug: "shorts-training",
    category: "shorts",
    title: {
      de: "Trainingsshorts",
      fr: "Short d'entraînement",
      it: "Pantaloncini da allenamento",
      en: "Training Shorts",
    },
    description: {
      de: "Leichte Shorts für Gym und Kampfsport.",
      fr: "Short léger pour la salle et les sports de combat.",
      it: "Pantaloncini leggeri per palestra e sport da combattimento.",
      en: "Lightweight shorts for the gym and combat sports.",
    },
    price: 4990,
    colors: ["Schwarz"],
  },
  {
    slug: "rashguard-long-sleeve",
    category: "t-shirts",
    title: {
      de: "Rashguard Langarm",
      fr: "Rashguard manches longues",
      it: "Rashguard maniche lunghe",
      en: "Long Sleeve Rashguard",
    },
    description: {
      de: "Kompressions-Rashguard für BJJ und MMA.",
      fr: "Rashguard de compression pour le BJJ et le MMA.",
      it: "Rashguard a compressione per BJJ e MMA.",
      en: "Compression rashguard for BJJ and MMA.",
    },
    price: 6990,
    colors: ["Schwarz", "Rot"],
  },
];

const categories: { slug: string; name: L }[] = [
  { slug: "t-shirts", name: { de: "T-Shirts", fr: "T-shirts", it: "T-shirt", en: "T-Shirts" } },
  { slug: "hoodies", name: { de: "Hoodies", fr: "Sweats", it: "Felpe", en: "Hoodies" } },
  { slug: "shorts", name: { de: "Shorts", fr: "Shorts", it: "Pantaloncini", en: "Shorts" } },
];

async function main() {
  await db.store.deleteMany({ where: { slug: "demo" } });

  const store = await db.store.create({
    data: {
      slug: "demo",
      name: "The Stores",
      contactEmail: "shop@example.ch",
      locations: { create: [{ name: "Lager Lugano", type: "WAREHOUSE" }] },
      categories: {
        create: categories.map((c, i) => ({ slug: c.slug, name: c.name, position: i })),
      },
    },
    include: { locations: true, categories: true },
  });

  const warehouse = store.locations[0];

  for (const p of products) {
    const category = store.categories.find((c) => c.slug === p.category);
    const variants = p.colors.flatMap((color, ci) =>
      SIZES.map((size, si) => ({
        sku: `${p.slug}-${color}-${size}`.toUpperCase(),
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        options: { size, color },
        position: ci * 10 + si,
        inventory: {
          create: { locationId: warehouse.id, quantity: size === "XXL" ? 0 : 5 + si },
        },
      })),
    );

    await db.product.create({
      data: {
        storeId: store.id,
        categoryId: category?.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        status: "ACTIVE",
        images: [],
        optionNames: ["size", "color"],
        optionValues: { color: Object.fromEntries(p.colors.map((c) => [c, COLORS[c]])) },
        variants: { create: variants },
      },
    });
  }

  console.log(`Seeded store "${store.name}" with ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
