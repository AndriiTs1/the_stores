import { describe, expect, it } from "vitest";
import { seedRefusal } from "./seed-guard";

const url = (host: string) => `postgresql://user:secret@${host}/neondb?sslmode=require`;
const PROD = "ep-prod-1.c-7.eu-central-1.aws.neon.tech";

describe("seedRefusal", () => {
  it("a local database is fine", () => {
    expect(seedRefusal({ DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/the_stores" })).toBeNull();
  });

  it("refuses the production database, by its direct or pooled host", () => {
    expect(seedRefusal({ DATABASE_URL: url(PROD), PRODUCTION_DB_HOST: PROD })).toMatch(/production database/);
    const pooled = "ep-prod-1-pooler.c-7.eu-central-1.aws.neon.tech";
    expect(seedRefusal({ DATABASE_URL: url(pooled), PRODUCTION_DB_HOST: PROD })).toMatch(/production database/);
    expect(seedRefusal({ DATABASE_URL: url(PROD), PRODUCTION_DB_HOST: pooled.toUpperCase() })).toMatch(/production/);
  });

  it("another Neon branch runs once production is known", () => {
    const dev = url("ep-dev-2.c-7.eu-central-1.aws.neon.tech");
    expect(seedRefusal({ DATABASE_URL: dev, PRODUCTION_DB_HOST: PROD })).toBeNull();
  });

  it("a remote database without PRODUCTION_DB_HOST is refused (cannot tell)", () => {
    expect(seedRefusal({ DATABASE_URL: url("ep-dev-2.c-7.eu-central-1.aws.neon.tech") })).toMatch(/PRODUCTION_DB_HOST/);
  });

  it("never on a Vercel production deployment, never without DATABASE_URL", () => {
    expect(seedRefusal({ DATABASE_URL: "postgresql://localhost/x", VERCEL_ENV: "production" })).toMatch(/production/);
    expect(seedRefusal({})).toMatch(/DATABASE_URL/);
  });
});
