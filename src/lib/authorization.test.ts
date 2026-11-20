import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  platformFindUnique: vi.fn(),
  storeFindUnique: vi.fn(),
  sellerFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db", () => ({
  db: {
    platformMembership: { findUnique: mocks.platformFindUnique },
    storeMembership: { findUnique: mocks.storeFindUnique },
    sellerMembership: { findFirst: mocks.sellerFindFirst },
  },
}));

import {
  requirePlatformRole,
  requireSellerRole,
  requireStoreRole,
} from "./authorization";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
  mocks.platformFindUnique.mockResolvedValue(null);
  mocks.storeFindUnique.mockResolvedValue(null);
  mocks.sellerFindFirst.mockResolvedValue(null);
});

describe("platform authorization", () => {
  it("rejects unauthenticated users", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(requirePlatformRole()).rejects.toThrow("UNAUTHORIZED");
    expect(mocks.platformFindUnique).not.toHaveBeenCalled();
  });

  it("rejects users without membership", async () => {
    await expect(requirePlatformRole()).rejects.toThrow("FORBIDDEN");
  });

  it("restricts allowed roles", async () => {
    mocks.platformFindUnique.mockResolvedValue({ role: "ADMIN" });
    await expect(requirePlatformRole(["OWNER"])).rejects.toThrow("FORBIDDEN");
  });

  it("accepts the correct role", async () => {
    mocks.platformFindUnique.mockResolvedValue({ role: "OWNER" });
    await expect(requirePlatformRole(["OWNER"])).resolves.toMatchObject({
      user: { id: "user-1" },
      membership: { role: "OWNER" },
    });
  });
});

describe("store authorization", () => {
  it("rejects missing membership", async () => {
    await expect(requireStoreRole("store-1")).rejects.toThrow("FORBIDDEN");
  });

  it("queries membership scoped to user and store", async () => {
    mocks.storeFindUnique.mockResolvedValue({ role: "MANAGER" });
    await requireStoreRole("store-1");
    expect(mocks.storeFindUnique).toHaveBeenCalledWith({
      where: { userId_storeId: { userId: "user-1", storeId: "store-1" } },
    });
  });

  it("rejects insufficient role", async () => {
    mocks.storeFindUnique.mockResolvedValue({ role: "STAFF" });
    await expect(requireStoreRole("store-1", ["OWNER"])).rejects.toThrow("FORBIDDEN");
  });
});

describe("seller authorization", () => {
  it("rejects missing membership", async () => {
    await expect(requireSellerRole("store-1", "seller-1")).rejects.toThrow("FORBIDDEN");
  });

  it("queries membership scoped to user, store and seller", async () => {
    mocks.sellerFindFirst.mockResolvedValue({ role: "MANAGER" });
    await requireSellerRole("store-1", "seller-1");
    expect(mocks.sellerFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", storeId: "store-1", sellerId: "seller-1" },
    });
  });

  it("rejects insufficient role", async () => {
    mocks.sellerFindFirst.mockResolvedValue({ role: "STAFF" });
    await expect(requireSellerRole("store-1", "seller-1", ["OWNER"])).rejects.toThrow("FORBIDDEN");
  });
});
