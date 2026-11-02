/**
 * HTTP Basic auth for the store admin and the internal /platform area (any username, ADMIN_PASSWORD).
 * Open in development when no password is set; closed in production without one.
 *
 * TODO(phase 1): replace with staff login — StaffUser + StoreMembership with roles
 * (AUDIT.md: P0-2, plan item 2, SaaS item 1). /platform then needs a platform-operator role.
 */
export function isAdminAuthorized(authorization: string | null) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production"; // open in dev only
  if (!authorization?.startsWith("Basic ")) return false;
  const [, pass] = atob(authorization.slice(6)).split(":");
  return pass === password;
}
