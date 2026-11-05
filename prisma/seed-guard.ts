/**
 * The seed deletes and recreates the demo store, so it must never run on the production database.
 * It runs only when it can tell the target is not production:
 *  - a local database (localhost) is always fine;
 *  - any other host needs PRODUCTION_DB_HOST (production's database host) in the environment, and must differ from it;
 *  - never on a Vercel production deployment.
 * Neon's pooled and direct hosts of one database differ only by "-pooler", so both count as the same database.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const dbHost = (host: string) => host.trim().toLowerCase().replace("-pooler.", ".");

/** Why the seed must not run on this database, or null when it may. */
export function seedRefusal(env: Record<string, string | undefined>): string | null {
  if (env.VERCEL_ENV === "production") return "VERCEL_ENV is production";
  let host: string;
  try {
    host = dbHost(new URL(env.DATABASE_URL ?? "").hostname);
  } catch {
    return "DATABASE_URL is missing or not a URL";
  }
  if (LOCAL_HOSTS.has(host)) return null;
  const production = env.PRODUCTION_DB_HOST ? dbHost(env.PRODUCTION_DB_HOST) : "";
  if (!production) return `PRODUCTION_DB_HOST is not set, so ${host} cannot be told apart from the production database`;
  if (host === production) return `DATABASE_URL points at the production database (${host})`;
  return null;
}
