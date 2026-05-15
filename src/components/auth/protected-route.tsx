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
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
            Verifying Session
          </p>
          <h1 className="mt-2 text-2xl font-light">Opening your portal</h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
