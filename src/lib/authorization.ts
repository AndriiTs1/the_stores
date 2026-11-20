import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requirePlatformRole(
  allowedRoles: readonly ("OWNER" | "ADMIN")[] = ["OWNER", "ADMIN"],
) {
  const user = await requireUser();

  const membership = await db.platformMembership.findUnique({
    where: { userId: user.id },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  return { user, membership };
}

export async function requireStoreRole(
  storeId: string,
  allowedRoles: readonly ("OWNER" | "MANAGER" | "STAFF")[] = [
    "OWNER",
    "MANAGER",
    "STAFF",
  ],
) {
  const user = await requireUser();

  const membership = await db.storeMembership.findUnique({
    where: {
      userId_storeId: {
        userId: user.id,
        storeId,
      },
    },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  return { user, membership };
}

export async function requireSellerRole(
  storeId: string,
  sellerId: string,
  allowedRoles: readonly ("OWNER" | "MANAGER" | "STAFF")[] = [
    "OWNER",
    "MANAGER",
    "STAFF",
  ],
) {
  const user = await requireUser();

  const membership = await db.sellerMembership.findFirst({
    where: {
      userId: user.id,
      storeId,
      sellerId,
    },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("FORBIDDEN");
  }

  return { user, membership };
}
