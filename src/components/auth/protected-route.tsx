"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/auth";
import { canAccessRole, getPortalPathForRole } from "@/lib/role-routing";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasAllowedRole = canAccessRole(user?.role, allowedRoles);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!hasAllowedRole) {
      const targetPortal = getPortalPathForRole(user?.role);
      router.replace(targetPortal);
    }
  }, [hasAllowedRole, isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading || !isAuthenticated || !hasAllowedRole) {
    return null;
  }

  return <>{children}</>;
}
