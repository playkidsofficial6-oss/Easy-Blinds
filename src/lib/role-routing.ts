import { UserRole } from "@/lib/auth";

export const ROLE_PORTAL_PATHS: Partial<Record<UserRole, string>> = {
  [UserRole.Owner]: "/dashboard",
  [UserRole.SalesManager]: "/dashboard",
  [UserRole.Salesman]: "/dashboard",
  [UserRole.Field]: "/dashboard",
  [UserRole.Fitter]: "/dashboard",
  [UserRole.Stitching]: "/dashboard",
  [UserRole.Admin]: "/dashboard",
  [UserRole.User]: "/dashboard",
};

export function getPortalPathForRole(role?: UserRole | null): string {
  return role ? ROLE_PORTAL_PATHS[role] ?? "/login" : "/login";
}

export function canAccessRole(userRole: UserRole | undefined, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles?.length) {
    return true;
  }
  return Boolean(userRole && allowedRoles.includes(userRole));
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
