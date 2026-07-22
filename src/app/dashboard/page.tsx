"use client";

import { useAuth } from "@/components/providers/auth-provider";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import SalesManagerDashboard from "@/components/dashboard/SalesManagerDashboard";
import SalesmanDashboard from "@/components/dashboard/SalesmanDashboard";
import FitterDashboard from "@/components/dashboard/FitterDashboard";
import StitchingDashboard from "@/components/dashboard/StitchingDashboard";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    switch (user.role) {
        case "owner":
            return <OwnerDashboard />;
        case "sales_manager":
            return <SalesManagerDashboard />;
        case "salesman":
        case "sales_man":
        case "field":
            return <SalesmanDashboard />;
        case "fitter":
            return <FitterDashboard />;
        case "stitching":
            return <StitchingDashboard />;
        default:
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-neutral-500">No dashboard view available for your role.</p>
                </div>
            );
    }
}
