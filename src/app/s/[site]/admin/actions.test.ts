import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  platformFindUnique: vi.fn(),
  storeFindUnique: vi.fn(),
  getStore: vi.fn(),
  productFindFirst: vi.fn(),
  orderFindFirst: vi.fn(),
  transaction: vi.fn(),
  orderUpdate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/authorization", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/tenant", () => ({
  getStore: mocks.getStore,
}));

vi.mock("@/lib/db", () => ({
  db: {
    platformMembership: { findUnique: mocks.platformFindUnique },
    storeMembership: { findUnique: mocks.storeFindUnique },
    product: { findFirst: mocks.productFindFirst },
    order: {
      findFirst: mocks.orderFindFirst,
      update: mocks.orderUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/orders", () => ({
  cancelPendingOrder: vi.fn(),
}));

import { setOrderStatus, updateProduct } from "./actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getStore.mockResolvedValue({ id: "store-1" });
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.platformFindUnique.mockResolvedValue(null);
  mocks.storeFindUnique.mockResolvedValue(null);
});

describe("admin mutation roles", () => {
  const formData = () => new FormData();

  beforeEach(() => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
  });

  it.each(["STAFF", null])("rejects store role %s", async (role) => {
    mocks.storeFindUnique.mockResolvedValue(role ? { role } : null);

    await expect(
      updateProduct("demo", "product-1", {}, formData()),
    ).rejects.toThrow("FORBIDDEN");

    expect(mocks.productFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each(["OWNER", "MANAGER"])("allows store role %s", async (role) => {
    mocks.storeFindUnique.mockResolvedValue({ role });

    await expect(
      updateProduct("demo", "missing-product", {}, formData()),
    ).rejects.toThrow("Product not found");

    expect(mocks.storeFindUnique).toHaveBeenCalledWith({
      where: {
        userId_storeId: { userId: "user-1", storeId: "store-1" },
      },
    });
    expect(mocks.productFindFirst).toHaveBeenCalled();
  });

  it.each(["OWNER", "ADMIN"])("allows platform role %s", async (role) => {
    mocks.platformFindUnique.mockResolvedValue({ role });

    await expect(
      updateProduct("demo", "missing-product", {}, formData()),
    ).rejects.toThrow("Product not found");

    expect(mocks.productFindFirst).toHaveBeenCalled();
  });

  it("rejects order changes for STAFF", async () => {
    mocks.storeFindUnique.mockResolvedValue({ role: "STAFF" });

    await expect(
      setOrderStatus("demo", "order-1", formData()),
    ).rejects.toThrow("FORBIDDEN");

    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
    expect(mocks.orderUpdate).not.toHaveBeenCalled();
  });
});

describe("admin mutation authorization", () => {
  it("rejects unauthorized product updates without modifying data", async () => {
    const formData = new FormData();

    await expect(
      updateProduct("demo", "product-1", {}, formData),
    ).rejects.toThrow("UNAUTHORIZED");

    expect(mocks.productFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects unauthorized order updates without modifying data", async () => {
    const formData = new FormData();
    formData.set("status", "PAID");

    await expect(
      setOrderStatus("demo", "order-1", formData),
    ).rejects.toThrow("UNAUTHORIZED");

    expect(mocks.orderFindFirst).not.toHaveBeenCalled();
    expect(mocks.orderUpdate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
