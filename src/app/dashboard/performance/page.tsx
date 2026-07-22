"use client";

import { useAuth } from "@/components/providers/auth-provider";
import OwnerPerformance from "@/components/dashboard/OwnerPerformance";
import SalesManagerPerformance from "@/components/dashboard/SalesManagerPerformance";

export default function PerformancePage() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "owner") {
        return <OwnerPerformance />;
    }
    
    if (user.role === "sales_manager") {
        return <SalesManagerPerformance />;
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <p className="text-neutral-500">You do not have access to this page.</p>
        </div>
    );
}
