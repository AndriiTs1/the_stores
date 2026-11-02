import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/lib/validation";

export const metadata = { title: "Admin sign-in" };

/**
 * Entry to a store's admin. Sign-in itself is still the browser's password prompt (HTTP Basic auth
 * in src/proxy.ts), shown when the admin opens: this page only takes the shop and goes there.
 * TODO(phase 1): real staff login (StaffUser + StoreMembership) with an email/password form here.
 */
export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  const { shop } = await searchParams;
  const parsed = shop === undefined ? null : adminLoginSchema.safeParse({ shop });
  if (parsed?.success) redirect(`/s/${parsed.data.shop}/admin`);
  const invalid = parsed != null;

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-black tracking-tight">Admin sign-in</h1>
      <p className="mt-2 text-sm text-muted">
        Enter your shop&apos;s address. Your browser then asks for the admin password.
      </p>
      <form method="get" noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="shop" className="label">
            Shop
          </label>
          <input
            id="shop"
            name="shop"
            className="input"
            placeholder="demo"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={typeof shop === "string" ? shop : ""}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "shop-error" : undefined}
          />
          {invalid && (
            <p id="shop-error" className="field-error">
              Lowercase letters, digits and hyphens, as in demo.your-domain.ch.
            </p>
          )}
        </div>
        <button className="btn w-full">Continue</button>
      </form>
    </main>
  );
}
