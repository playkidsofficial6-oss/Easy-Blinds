"use client";

import { useAuth } from "@/components/providers/auth-provider";
import OwnerTeam from "@/components/dashboard/OwnerTeam";
import DashboardTeam from "@/components/dashboard/DashboardTeam";

export default function TeamPage() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "owner") {
        return <OwnerTeam />;
    }
    
    // Fallback for any other roles that have access to the old (dashboard)/team route
    return <DashboardTeam />;
}
