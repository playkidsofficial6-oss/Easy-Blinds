import { UserRole } from "@/lib/auth";

export const ROLE_PORTAL_PATHS: Partial<Record<UserRole, string>> = {
  owner: "/dashboard",
  sales_manager: "/dashboard",
  salesman: "/dashboard",
  sales_man: "/dashboard",
  fitter: "/dashboard",
  stitching: "/dashboard",
  field: "/dashboard",
};

function normalizeRole(role?: UserRole | null): UserRole | undefined {
  return role === "sales_man" ? "salesman" : role ?? undefined;
}

export function getPortalPathForRole(role?: UserRole | null): string {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? ROLE_PORTAL_PATHS[normalizedRole] ?? "/login" : "/login";
}

export function canAccessRole(userRole: UserRole | undefined, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles?.length) {
    return true;
  }

  const normalizedRole = normalizeRole(userRole);
  return Boolean(normalizedRole && allowedRoles.includes(normalizedRole));
}

export function getSafePortalRedirect(role: UserRole, requestedPath?: string | null): string {
  const rolePortalPath = getPortalPathForRole(role);

  if (!requestedPath || rolePortalPath === "/login") {
    return rolePortalPath;
  }

  const isSamePortal =
    requestedPath === rolePortalPath || requestedPath.startsWith(`${rolePortalPath}/`);

  return isSamePortal ? requestedPath : rolePortalPath;
}
