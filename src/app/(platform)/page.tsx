// Platform home: later the marketing site and "create your shop" sign-up.
// The list of stores is internal and lives in /platform.
export default function PlatformHome() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">The Stores</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Online-Shops für die Schweiz</h1>
      <p className="mt-3 text-muted">
        TWINT, drei Sprachen, Schweizer MwSt. und Post — ohne Umsatzprovision.
      </p>
    </main>
  );
}
