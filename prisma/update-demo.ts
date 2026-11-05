import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_SLUG, demoStoreTexts } from "./demo-store";

/**
 * Brings the demo store's texts (name, message bar, banner) up to date in place: an update of that one row,
 * nothing deleted or recreated, so it is safe to run again and on a database with real orders.
 *   npm run db:update-demo     (DATABASE_URL = the target database)
 */
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  const { count } = await db.store.updateMany({ where: { slug: DEMO_SLUG }, data: demoStoreTexts });
  console.log(count ? `Demo store updated on ${host}.` : `No "${DEMO_SLUG}" store on ${host}: nothing changed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
