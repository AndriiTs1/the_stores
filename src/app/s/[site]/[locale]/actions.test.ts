import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutMode } from "@/lib/payments";

// placeOrder with everything around it replaced: what matters is what it calls.
const orders = vi.hoisted(() => ({
  createPendingOrder: vi.fn(),
  markOrderPaid: vi.fn(),
  cancelPendingOrder: vi.fn(),
  createCheckoutSession: vi.fn(),
  clearCart: vi.fn(),
  orderUpdate: vi.fn(),
  expireSession: vi.fn(),
}));
vi.mock("@/lib/orders", () => ({
  createPendingOrder: orders.createPendingOrder,
  markOrderPaid: orders.markOrderPaid,
  cancelPendingOrder: orders.cancelPendingOrder,
  OutOfStockError: class extends Error {},
}));
vi.mock("@/lib/payments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments")>()),
  createCheckoutSession: orders.createCheckoutSession,
  getStripe: () => ({
    checkout: { sessions: { expire: orders.expireSession } },
  }),
}));
vi.mock("@/lib/db", () => ({ db: { order: { update: orders.orderUpdate } } }));
vi.mock("@/lib/inventory", () => ({ inventoryInclude: {}, onlineStock: () => 0 }));
vi.mock("@/lib/cart", () => ({
  clearCart: orders.clearCart,
  readCart: vi.fn(),
  writeCart: vi.fn(),
  getCartLines: vi.fn(async () => [{ variantId: "v1", quantity: 1, unitPrice: 1000 }]),
}));
vi.mock("@/lib/tenant", () => ({
  getBase: async () => "/s/demo",
  getStoreAndLocale: async () => ({ store: { id: "s1", slug: "demo", currency: "CHF" }, locale: "de" }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const { placeOrder } = await import("./actions");

function form() {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    email: "a@b.ch",
    name: "Anna Muster",
    street: "Bahnhofstrasse 1",
    zip: "8001",
    city: "Zürich",
    country: "CH",
  }))
    f.set(k, v);
  return f;
}

describe("checkoutMode", () => {
  it("a Stripe key: real payment, anywhere", () => {
    expect(checkoutMode({ STRIPE_SECRET_KEY: "sk_test_x", VERCEL_ENV: "production" })).toBe("stripe");
  });
  it("no key: test mode locally, closed on a Vercel preview or production deployment", () => {
    expect(checkoutMode({})).toBe("test");
    expect(checkoutMode({ VERCEL_ENV: "development" })).toBe("test");
    expect(checkoutMode({ VERCEL_ENV: "preview" })).toBe("closed");
    expect(checkoutMode({ VERCEL_ENV: "production", STRIPE_SECRET_KEY: "" })).toBe("closed");
  });
});

describe("placeOrder without a Stripe key", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    orders.createPendingOrder.mockReset();
    orders.markOrderPaid.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  for (const env of ["preview", "production"]) {
    it(`on Vercel ${env}: refuses, creates no order and reserves no stock`, async () => {
      vi.stubEnv("VERCEL_ENV", env);
      await expect(placeOrder("demo", "de", {}, form())).resolves.toEqual({ closed: true });
      expect(orders.createPendingOrder).not.toHaveBeenCalled(); // it is what reserves the stock
      expect(orders.markOrderPaid).not.toHaveBeenCalled();
    });
  }

  it("locally: test mode still creates the order and marks it paid", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    orders.createPendingOrder.mockResolvedValue({ id: "o1", items: [], shipping: 0 });
    await expect(placeOrder("demo", "de", {}, form())).rejects.toThrow("redirect /s/demo/de/order/o1");
    expect(orders.createPendingOrder).toHaveBeenCalledOnce();
    expect(orders.markOrderPaid).toHaveBeenCalledWith("o1", "test", "test_o1");
  });
});

describe("placeOrder with Stripe", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    orders.createPendingOrder.mockReset();
    orders.cancelPendingOrder.mockReset();
    orders.createCheckoutSession.mockReset();
    orders.clearCart.mockReset();
    orders.orderUpdate.mockReset();
    orders.expireSession.mockReset();
    orders.createCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/test",
    });
    orders.createPendingOrder.mockResolvedValue({
      id: "o1",
      items: [],
      shipping: 0,
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("cancels the pending order when Stripe session creation fails", async () => {
    orders.createCheckoutSession.mockRejectedValue(new Error("Stripe unavailable"));

    await expect(placeOrder("demo", "de", {}, form()))
      .rejects.toThrow("Stripe unavailable");

    expect(orders.createPendingOrder).toHaveBeenCalledOnce();
    expect(orders.cancelPendingOrder).toHaveBeenCalledExactlyOnceWith("o1");
    expect(orders.clearCart).not.toHaveBeenCalled();
  });
});

describe("Stripe payment reference persistence", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    orders.createPendingOrder.mockReset();
    orders.cancelPendingOrder.mockReset();
    orders.createCheckoutSession.mockReset();
    orders.orderUpdate.mockReset();
    orders.expireSession.mockReset();
    orders.clearCart.mockReset();

    orders.createPendingOrder.mockResolvedValue({
      id: "o1",
      items: [],
      shipping: 0,
    });
    orders.createCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/test",
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("saves the payment reference before redirecting", async () => {
    await expect(placeOrder("demo", "de", {}, form()))
      .rejects.toThrow("redirect https://checkout.stripe.com/test");

    expect(orders.orderUpdate).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: {
        paymentProvider: "stripe",
        paymentRef: "cs_test_123",
      },
    });
    expect(orders.clearCart).toHaveBeenCalledOnce();
    expect(orders.cancelPendingOrder).not.toHaveBeenCalled();
  });

  it("expires the Stripe session before cancelling on database failure", async () => {
    orders.orderUpdate.mockRejectedValue(new Error("Neon unavailable"));

    await expect(placeOrder("demo", "de", {}, form()))
      .rejects.toThrow("Neon unavailable");

    expect(orders.expireSession).toHaveBeenCalledExactlyOnceWith("cs_test_123");
    expect(orders.cancelPendingOrder).toHaveBeenCalledExactlyOnceWith("o1");
    expect(orders.expireSession.mock.invocationCallOrder[0])
      .toBeLessThan(orders.cancelPendingOrder.mock.invocationCallOrder[0]);
    expect(orders.clearCart).not.toHaveBeenCalled();
  });

  it("does not cancel the order if Stripe session expiration fails", async () => {
    orders.orderUpdate.mockRejectedValue(new Error("Neon unavailable"));
    orders.expireSession.mockRejectedValue(new Error("Stripe unavailable"));

    await expect(placeOrder("demo", "de", {}, form()))
      .rejects.toThrow("Payment reference could not be saved and Stripe session expiration failed");

    expect(orders.cancelPendingOrder).not.toHaveBeenCalled();
    expect(orders.clearCart).not.toHaveBeenCalled();
  });
});
