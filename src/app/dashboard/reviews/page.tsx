"use client";

import { useAuth } from "@/components/providers/auth-provider";
import SalesManagerReviews from "@/components/dashboard/SalesManagerReviews";
import SalesmanReviews from "@/components/dashboard/SalesmanReviews";

import { isFieldRole, isSalesManagerRole, isSalesmanRole } from "@/lib/auth";

export default function ReviewsPage() {
    const { user } = useAuth();

    if (!user) return null;

    if (isSalesManagerRole(user.role)) {
        return <SalesManagerReviews />;
    }
    
    if (isSalesmanRole(user.role) || isFieldRole(user.role)) {
        return <SalesmanReviews />;
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <p className="text-neutral-500">You do not have access to this page.</p>
        </div>
    );
}
