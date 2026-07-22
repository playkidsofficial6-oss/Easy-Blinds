"use client";

import { useAuth } from "@/components/providers/auth-provider";
import SalesManagerReviews from "@/components/dashboard/SalesManagerReviews";
import SalesmanReviews from "@/components/dashboard/SalesmanReviews";

export default function ReviewsPage() {
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === "sales_manager") {
        return <SalesManagerReviews />;
    }
    
    if (user.role === "salesman" || user.role === "sales_man" || user.role === "field") {
        return <SalesmanReviews />;
    }

    return (
        <div className="flex items-center justify-center h-full p-8">
            <p className="text-neutral-500">You do not have access to this page.</p>
        </div>
    );
}
