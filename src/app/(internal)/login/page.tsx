import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in | THE STORES",
  description: "Secure sign in to THE STORES.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 sm:px-8">
      <header className="mx-auto flex w-full max-w-6xl items-center py-4 sm:py-8">
        <span className="text-sm font-black tracking-[-0.04em]">
          THE STORES<span className="text-muted">.</span>
        </span>
      </header>

      <section className="flex flex-1 items-center justify-center py-6 sm:py-16">
        <div className="w-full max-w-[420px] py-2">
          <div className="mb-6 sm:mb-10">
            <div className="mb-4 sm:mb-5 inline-flex items-center rounded-full border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Account access
            </div>

            <h1 className="text-[clamp(2.35rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.055em]">
              Welcome back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted">
              Sign in to manage your stores, products and operations.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-line py-4 text-[11px] text-muted sm:py-6">
        <span>© {new Date().getFullYear()} THE STORES</span>
        <span>Commerce platform</span>
      </footer>
    </main>
  );
}
