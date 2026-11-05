import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_SLUG, demoCollectionTiles, demoStoreTexts } from "./demo-store";

/**
 * Brings the demo store's texts (name, message bar, banner) and its collections' tile colours up to date in place:
 * updates only, nothing deleted or recreated, so it is safe to run again and on a database with real orders.
 *   npm run db:update-demo     (DATABASE_URL = the target database)
 */
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  const { count } = await db.store.updateMany({ where: { slug: DEMO_SLUG }, data: demoStoreTexts });
  if (!count) {
    console.log(`No "${DEMO_SLUG}" store on ${host}: nothing changed.`);
    return;
  }
  let tiles = 0;
  for (const [slug, data] of Object.entries(demoCollectionTiles)) {
    tiles += (await db.collection.updateMany({ where: { slug, store: { slug: DEMO_SLUG } }, data })).count;
  }
  console.log(`Demo store updated on ${host} (${tiles} collection tiles).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
