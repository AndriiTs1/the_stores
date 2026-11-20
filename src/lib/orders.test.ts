import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  releaseStock: vi.fn(),
  orderUpdateMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
    order: { updateMany: mocks.orderUpdateMany },
  },
}));

vi.mock("@/lib/inventory", () => ({
  reserveStock: vi.fn(),
  releaseStock: mocks.releaseStock,
}));

import { cancelPendingOrder, markOrderPaid } from "./orders";

beforeEach(() => {
  vi.resetAllMocks();

  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      order: {
        findUnique: mocks.findUnique,
        updateMany: mocks.updateMany,
      },
    }),
  );

  mocks.findUnique.mockResolvedValue({
    id: "order-1",
    storeId: "store-1",
    status: "PENDING",
    items: [{ variantId: "variant-1", quantity: 2 }],
  });

  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe("cancelPendingOrder", () => {
  it("returns stock after claiming a pending order", async () => {
    await cancelPendingOrder("order-1");

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "order-1", status: "PENDING" },
      data: { status: "CANCELLED" },
    });

    expect(mocks.releaseStock).toHaveBeenCalledOnce();
    expect(mocks.releaseStock).toHaveBeenCalledWith(
      expect.anything(),
      "store-1",
      "variant-1",
      2,
    );
  });

  it("does not release stock for an already cancelled order", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "order-1",
      storeId: "store-1",
      status: "CANCELLED",
      items: [],
    });

    await cancelPendingOrder("order-1");

    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.releaseStock).not.toHaveBeenCalled();
  });

  it("does not release stock when another operation claimed the order", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await cancelPendingOrder("order-1");

    expect(mocks.releaseStock).not.toHaveBeenCalled();
  });
});

describe("markOrderPaid", () => {
  it("requires matching Stripe payment reference", async () => {
    await markOrderPaid("order-1", "stripe", "cs_test_123");

    expect(mocks.orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        status: "PENDING",
        paymentProvider: "stripe",
        paymentRef: "cs_test_123",
      },
      data: {
        status: "PAID",
        paymentProvider: "stripe",
        paymentRef: "cs_test_123",
        paidAt: expect.any(Date),
      },
    });
  });

  it("does not require a preexisting reference in local test mode", async () => {
    await markOrderPaid("order-1", "test", "test_order-1");

    expect(mocks.orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paymentProvider: "test",
        paymentRef: "test_order-1",
        paidAt: expect.any(Date),
      },
    });
  });
});
