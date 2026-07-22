"use client";

import { useAuth } from "@/components/providers/auth-provider";
import OwnerAnalytics from "@/components/dashboard/OwnerAnalytics";

export default function AnalyticsPage() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "owner") {
        return <OwnerAnalytics />;
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <p className="text-neutral-500">You do not have access to this page.</p>
        </div>
    );
}
