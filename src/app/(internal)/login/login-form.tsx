"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setServerError("");

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        setServerError("Incorrect email or password. Please try again.");
        return;
      }

      router.replace("/platform");
      router.refresh();
    } catch {
      setServerError("Unable to sign in. Check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5 sm:space-y-6"
    >
      <div className="space-y-2.5">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium tracking-tight"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className="h-13 w-full rounded-xl border border-line bg-background px-4 text-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 hover:border-foreground/30 focus:border-foreground focus:ring-4 focus:ring-foreground/5 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/10"
          {...register("email")}
        />
        {errors.email && (
          <p id="login-email-error" role="alert" className="text-xs leading-5 text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium tracking-tight"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className="h-13 w-full rounded-xl border border-line bg-background px-4 pr-14 text-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 hover:border-foreground/30 focus:border-foreground focus:ring-4 focus:ring-foreground/5 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-1.5 right-2 flex w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" role="alert" className="text-xs leading-5 text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-neutral-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={17} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted">
        <LockKeyhole size={13} aria-hidden="true" />
        <span>Secure access to THE STORES</span>
      </div>
    </form>
  );
}
