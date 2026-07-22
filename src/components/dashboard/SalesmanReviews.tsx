"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Star, CheckCircle2, XCircle, Calendar, Filter, Building2 } from "lucide-react";
import { getReviewsByFitter } from "@/lib/data/reviews";
import { ImageUpload } from "@/components/ui/image-upload";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useBrand } from "@/components/providers/brand-provider";

type DateFilter = "today" | "yesterday" | "month" | "all";

const brands = [
    {
        id: "easy-blinds",
        name: "Easy Blinds & Curtains",
        styles: {
            button: "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200",
            border: "border-neutral-200 dark:border-neutral-800",
            activeBorder: "peer-data-[state=checked]:border-neutral-900 dark:peer-data-[state=checked]:border-white peer-data-[state=checked]:bg-neutral-50 dark:peer-data-[state=checked]:bg-neutral-950/20",
            icon: "text-neutral-900 dark:text-white",
            badge: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
        }
    },
    {
        id: "my-thread",
        name: "My Thread",
        styles: {
            button: "bg-purple-600 hover:bg-purple-700 text-white",
            border: "border-purple-100 dark:border-purple-900",
            activeBorder: "peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:bg-purple-50 dark:peer-data-[state=checked]:bg-purple-950/20",
            icon: "text-purple-600 dark:text-purple-400",
            badge: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        }
    },
    {
        id: "oceana",
        name: "Oceana",
        styles: {
            button: "bg-blue-600 hover:bg-blue-700 text-white",
            border: "border-blue-100 dark:border-blue-900",
            activeBorder: "peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950/20",
            icon: "text-blue-600 dark:text-blue-400",
            badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        }
    },
    {
        id: "hillarys",
        name: "Hillarys",
        styles: {
            button: "bg-rose-600 hover:bg-rose-700 text-white",
            border: "border-rose-100 dark:border-rose-900",
            activeBorder: "peer-data-[state=checked]:border-rose-600 peer-data-[state=checked]:bg-rose-50 dark:peer-data-[state=checked]:bg-rose-950/20",
            icon: "text-rose-600 dark:text-rose-400",
            badge: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        }
    }
];

export default function ReviewPage() {
    const [clientName, setClientName] = useState("");
    const [reviewStatus, setReviewStatus] = useState<"posted" | "not-posted" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState<DateFilter>("today");

    const { selectedBrand } = useBrand();

    const reviewLink = "https://maps.app.goo.gl/WCwfyyEhR7Upk4E69/review";

    // Offline Sync Logic
    useEffect(() => {
        const syncReviews = async () => {
            if (navigator.onLine) {
                const pendingReviews = localStorage.getItem("pending_reviews");
                if (pendingReviews) {
                    const reviews = JSON.parse(pendingReviews);
                    if (reviews.length > 0) {
                        toast.loading(`Syncing ${reviews.length} offline reviews...`);

                        // Simulate API calls for each review
                        await new Promise((resolve) => setTimeout(resolve, 1500));

                        localStorage.removeItem("pending_reviews");
                        toast.dismiss();
                        toast.success(`Successfully synced ${reviews.length} reviews!`);
                    }
                }
            }
        };

        window.addEventListener("online", syncReviews);
        // Check on mount
        syncReviews();

        return () => window.removeEventListener("online", syncReviews);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewStatus) {
            toast.error("Please select a review status");
            return;
        }

        if (reviewStatus === "posted" && images.length === 0) {
            toast.error("Please upload proof of the review");
            return;
        }

        setIsSubmitting(true);

        // Check for offline status
        if (!navigator.onLine) {
            const newReview = {
                id: Date.now().toString(),
                clientName,
                status: reviewStatus,
                images,
                date: new Date().toISOString(),
                synced: false,
                brand: selectedBrand.id
            };

            const existing = JSON.parse(localStorage.getItem("pending_reviews") || "[]");
            localStorage.setItem("pending_reviews", JSON.stringify([...existing, newReview]));

            toast.success("You are offline. Review saved and will sync when online.");
            setClientName("");
            setReviewStatus(null);
            setImages([]);
            setIsSubmitting(false);
            return;
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success("Review status recorded successfully");
        setClientName("");
        setReviewStatus(null);
        setImages([]);
        setIsSubmitting(false);
    };

    // Filter Logic
    const allReviews = getReviewsByFitter("1");
    const filteredReviews = allReviews.filter(review => {
        // Filter by brand (mock logic - assuming all reviews are for the default brand for now unless we update mock data)
        // For demonstration, we'll just filter by date as before, but in a real app we'd filter by brand ID too.
        // const isBrandMatch = review.brandId === selectedBrand.id; 

        const reviewDate = new Date(review.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset times for accurate date comparison
        reviewDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);

        switch (dateFilter) {
            case "today":
                return reviewDate.getTime() === today.getTime();
            case "yesterday":
                return reviewDate.getTime() === yesterday.getTime();
            case "month":
                return reviewDate.getMonth() === today.getMonth() && reviewDate.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    });

    // Stats Logic
    const stats = {
        total: filteredReviews.length,
        posted: filteredReviews.filter(r => r.status === "posted").length,
        notPosted: filteredReviews.filter(r => r.status === "pending").length
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white">
                    Customer Review
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Ask the customer to scan the QR code to leave a review.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column: QR Code */}
                <div className="space-y-8">
                    {/* QR Code Section */}
                    <Card className={cn("border-2 shadow-lg bg-white dark:bg-neutral-900 transition-colors duration-300", selectedBrand.styles.border)}>
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-xl font-medium">Scan to Review</CardTitle>
                            <CardDescription>{selectedBrand.name} Business Profile</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center p-8 pt-4 space-y-6">
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                                <QRCode
                                    value={reviewLink}
                                    size={200}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                            <div className={cn("flex items-center gap-2 font-medium transition-colors duration-300", selectedBrand.styles.icon)}>
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                                <Star className="w-5 h-5 fill-current" />
                            </div>
                            <p className="text-sm text-center text-neutral-500">
                                Your feedback helps us improve our service.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Record Outcome Form */}
                <div className="space-y-8">
                    {/* Feedback Form Section */}
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-xl font-medium">Record Outcome</CardTitle>
                            <CardDescription>
                                Track if the customer posted a review during the visit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Client Name (Optional)</Label>
                                    <Input
                                        id="clientName"
                                        placeholder="e.g. Ahmed Al Mansoori"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="bg-white dark:bg-neutral-900"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Review Status</Label>
                                    <RadioGroup
                                        value={reviewStatus || ""}
                                        onValueChange={(value) => setReviewStatus(value as "posted" | "not-posted")}
                                        className="grid grid-cols-1 gap-3"
                                    >
                                        <div>
                                            <RadioGroupItem
                                                value="posted"
                                                id="posted"
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor="posted"
                                                className={cn(
                                                    "flex items-center justify-between rounded-md border-2 border-neutral-200 bg-white p-4 hover:bg-neutral-50 cursor-pointer transition-all dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                                                    selectedBrand.styles.activeBorder
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full transition-colors", selectedBrand.styles.badge)}>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="font-medium">Review Posted</div>
                                                </div>
                                            </Label>
                                        </div>

                                        <div>
                                            <RadioGroupItem
                                                value="not-posted"
                                                id="not-posted"
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor="not-posted"
                                                className="flex items-center justify-between rounded-md border-2 border-neutral-200 bg-white p-4 hover:bg-neutral-50 peer-data-[state=checked]:border-neutral-500 peer-data-[state=checked]:bg-neutral-50 [&:has([data-state=checked])]:border-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:peer-data-[state=checked]:border-neutral-500 dark:peer-data-[state=checked]:bg-neutral-800 cursor-pointer transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        <XCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="font-medium">Not Posted</div>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {reviewStatus === "posted" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Proof of Review</Label>
                                        <ImageUpload
                                            value={images}
                                            onChange={(urls) => setImages(urls)}
                                            onRemove={(url) => setImages(images.filter((current) => current !== url))}
                                            maxImages={1}
                                        />
                                        <p className="text-xs text-neutral-500">
                                            Please upload a screenshot or photo of the posted review.
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className={cn("w-full transition-colors duration-300", selectedBrand.styles.button)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save Record"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* History & Stats - Full Width */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-light text-neutral-900 dark:text-white">My History</h2>
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                        {(["today", "yesterday", "month", "all"] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setDateFilter(filter)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                                    dateFilter === filter
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total</div>
                        <div className="text-2xl font-light text-neutral-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className={cn("p-4 rounded-xl border transition-colors duration-300", selectedBrand.styles.badge.replace("text-", "bg-").replace("bg-", "bg-opacity-10 border-"))}>
                        <div className={cn("text-xs uppercase tracking-wider mb-1", selectedBrand.styles.icon)}>Posted</div>
                        <div className={cn("text-2xl font-light", selectedBrand.styles.icon)}>{stats.posted}</div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Missed</div>
                        <div className="text-2xl font-light text-neutral-900 dark:text-white">{stats.notPosted}</div>
                    </div>
                </div>

                {/* Review List */}
                <div className="space-y-px bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    {filteredReviews.length === 0 ? (
                        <div className="p-8 text-center bg-white dark:bg-neutral-900">
                            <p className="text-neutral-500">No reviews found for this period.</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review.id} className="bg-white dark:bg-neutral-900 p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{review.clientName}</h3>
                                        <p className="text-sm text-neutral-500">{review.date}</p>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${review.status === 'posted'
                                        ? selectedBrand.styles.badge
                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                        }`}>
                                        {review.status === 'posted' ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Posted
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                Not Posted
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
}
