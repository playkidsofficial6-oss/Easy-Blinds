import { UserRole } from "@/lib/auth";

export const ROLE_PORTAL_PATHS: Partial<Record<UserRole, string>> = {
  owner: "/owner",
  sales_manager: "/sales-manager",
  salesman: "/salesman",
  sales_man: "/salesman",
  fitter: "/fitter",
  stitching: "/stitching",
  field: "/field",
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
