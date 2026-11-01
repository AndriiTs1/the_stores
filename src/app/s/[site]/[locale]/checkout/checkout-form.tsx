"use client";

import { startTransition, useActionState, useEffect, useId, useSyncExternalStore } from "react";
import { Controller, useForm, type FieldPath, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "@/components/ui/select";
import { checkoutSchema, errorText, type CheckoutInput } from "@/lib/validation";
import { CHECKOUT_DEFAULTS as DEFAULTS, readCheckoutDraft as readDraft } from "@/lib/checkout-draft";
import type { CheckoutState } from "../actions";

type Labels = {
  contact: string;
  shipping: string;
  email: string;
  phone: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  submit: string;
};

export function CheckoutForm({
  action,
  draftKey,
  locale,
  labels,
  countries,
  note,
}: {
  action: (state: CheckoutState, formData: FormData) => Promise<CheckoutState>;
  /** sessionStorage key (per store): what was typed survives a language switch or reload. */
  draftKey: string;
  locale: string;
  labels: Labels;
  countries: { value: CheckoutInput["country"]; label: string }[];
  note?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    subscribe,
    trigger,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: DEFAULTS,
  });

  // Restore the draft once; fields that had content are re-validated, so errors show in the new language.
  useEffect(() => {
    const draft = readDraft(draftKey);
    if (!draft) return;
    reset({ ...DEFAULTS, ...draft }, { keepDefaultValues: true });
    const filled = (Object.keys(draft) as (keyof CheckoutInput)[]).filter((k) => k !== "country" && draft[k]);
    if (filled.length) trigger(filled);
  }, [draftKey, reset, trigger]);

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        try {
          sessionStorage.setItem(draftKey, JSON.stringify(values));
        } catch {
          // storage unavailable (private mode): the form still works, only without a draft
        }
      },
    });
  }, [draftKey, subscribe]);

  // The server re-validates with the same schema; show its errors on the same fields.
  useEffect(() => {
    for (const [field, code] of Object.entries(state.fieldErrors ?? {})) {
      setError(field as FieldPath<CheckoutInput>, { type: "server", message: code }, { shouldFocus: true });
    }
  }, [state, setError]);

  const onValid = (values: CheckoutInput) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) formData.set(key, value ?? "");
    startTransition(() => formAction(formData));
  };

  const id = useId();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const field = (name: keyof CheckoutInput) => {
    // Before hydration (no-JS submit) server errors render straight from state; afterwards setError owns them.
    const message = errors[name]?.message ?? (hydrated ? undefined : state.fieldErrors?.[name]);
    return {
      id: `${id}-${name}`,
      errorId: `${id}-${name}-error`,
      error: message ? errorText(message, locale) : undefined,
    };
  };

  return (
    // `action` is the no-JS fallback; with JS, handleSubmit validates first and calls preventDefault.
    <form action={formAction} onSubmit={handleSubmit(onValid)} noValidate className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">{labels.contact}</h2>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <TextField
            {...field("email")}
            label={labels.email}
            type="email"
            autoComplete="email"
            aria-required
            reg={register("email")}
          />
          <TextField {...field("phone")} label={labels.phone} type="tel" autoComplete="tel" reg={register("phone")} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{labels.shipping}</h2>
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <TextField {...field("name")} label={labels.name} autoComplete="name" aria-required reg={register("name")} />
          <div className="min-w-0">
            <label htmlFor={field("country").id} className="label">
              {labels.country}
            </label>
            <Controller
              control={control}
              name="country"
              render={({ field: f }) => (
                <Select
                  id={field("country").id}
                  name={f.name}
                  value={f.value}
                  onValueChange={f.onChange}
                  onBlur={f.onBlur}
                  options={countries}
                  invalid={!!field("country").error}
                  describedBy={field("country").error ? field("country").errorId : undefined}
                />
              )}
            />
            <FieldError id={field("country").errorId} message={field("country").error} />
          </div>
        </div>
        {/* Phone: one column · tablet: street, then PLZ | city · desktop: street | PLZ | city in one row. */}
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,2fr)_7rem_minmax(0,1fr)]">
          <TextField
            {...field("street")}
            className="sm:col-span-2 lg:col-span-1"
            label={labels.address}
            autoComplete="street-address"
            aria-required
            reg={register("street")}
          />
          <TextField
            {...field("zip")}
            label={labels.zip}
            autoComplete="postal-code"
            inputMode="numeric"
            aria-required
            reg={register("zip")}
          />
          <TextField
            {...field("city")}
            label={labels.city}
            autoComplete="address-level2"
            aria-required
            reg={register("city")}
          />
        </div>
      </section>

      <button type="submit" className="btn btn-accent w-full" disabled={isPending} aria-busy={isPending}>
        <span className="truncate">{labels.submit}</span>
      </button>
      {note && <p className="text-center text-xs text-muted">{note}</p>}
    </form>
  );
}

function TextField({
  id,
  errorId,
  error,
  label,
  reg,
  className = "",
  ...props
}: {
  id: string;
  errorId: string;
  error?: string;
  label: string;
  reg: UseFormRegisterReturn;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "name" | "onChange" | "onBlur">) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
        {...reg}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      {message}
    </p>
  );
}
