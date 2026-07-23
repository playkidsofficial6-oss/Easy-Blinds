"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrackingRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dashboard/fitter");
    }, [router]);

    return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400 font-light text-sm">
            Redirecting to Fitters tracking...
        </div>
    );
}
