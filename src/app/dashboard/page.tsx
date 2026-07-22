"use client";

import { useAuth } from "@/components/providers/auth-provider";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import SalesManagerDashboard from "@/components/dashboard/SalesManagerDashboard";
import SalesmanDashboard from "@/components/dashboard/SalesmanDashboard";
import FitterDashboard from "@/components/dashboard/FitterDashboard";
import StitchingDashboard from "@/components/dashboard/StitchingDashboard";

import { isFieldRole, isFitterRole, isOwnerRole, isSalesManagerRole, isSalesmanRole, UserRole } from "@/lib/auth";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    if (isOwnerRole(user.role)) {
        return <OwnerDashboard />;
    }
    if (isSalesManagerRole(user.role)) {
        return <SalesManagerDashboard />;
    }
    if (isSalesmanRole(user.role) || isFieldRole(user.role)) {
        return <SalesmanDashboard />;
    }
    if (isFitterRole(user.role)) {
        return <FitterDashboard />;
    }
    if (user.role === UserRole.Stitching || String(user.role).toLowerCase() === "stitching") {
        return <StitchingDashboard />;
    }

    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-neutral-500">No dashboard view available for your role.</p>
        </div>
    );
}
