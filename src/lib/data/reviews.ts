export interface Review {
    id: string;
    jobId: string;
    fitterId: string;
    fitterName: string;
    clientName: string;
    status: "posted" | "pending";
    rating?: number; // 1-5
    date: string;
    comment?: string;
    proofUrl?: string;
}

export const mockReviews: Review[] = [
    // Mr Alvin (High Performer)
    { id: "R1", jobId: "J001", fitterId: "T001", fitterName: "Mr Alvin", clientName: "Ahmed Al Mansoori", status: "posted", rating: 5, date: "2023-12-09", comment: "Excellent work, very professional.", proofUrl: "/placeholder-review.jpg" },
    { id: "R2", jobId: "J012", fitterId: "T001", fitterName: "Mr Alvin", clientName: "Sarah Smith", status: "posted", rating: 5, date: "2023-12-08", comment: "Clean and fast installation." },
    { id: "R3", jobId: "J015", fitterId: "T001", fitterName: "Mr Alvin", clientName: "Emaar Properties", status: "pending", date: "2023-12-07" }, // Pending > 24h
    { id: "R4", jobId: "J022", fitterId: "T001", fitterName: "Mr Alvin", clientName: "John Doe", status: "posted", rating: 4, date: "2023-12-05" },

    // Mr Kashif (Mid Performer - Missing Reviews)
    { id: "R5", jobId: "J005", fitterId: "T002", fitterName: "Mr Kashif", clientName: "Villa 124", status: "posted", rating: 5, date: "2023-12-01" },
    { id: "R6", jobId: "J008", fitterId: "T002", fitterName: "Mr Kashif", clientName: "Marina Heights", status: "pending", date: "2023-12-02" },
    { id: "R7", jobId: "J018", fitterId: "T002", fitterName: "Mr Kashif", clientName: "Palm Tower", status: "pending", date: "2023-12-06" },
    { id: "R8", jobId: "J025", fitterId: "T002", fitterName: "Mr Kashif", clientName: "JVC Villa", status: "pending", date: "2023-12-08" },

    // Mr Yameen (Good Rating, Low Volume)
    { id: "R9", jobId: "J003", fitterId: "T003", fitterName: "Mr Yameen", clientName: "Palm Jumeirah Villa", status: "posted", rating: 5, date: "2023-12-01" },
    { id: "R10", jobId: "J019", fitterId: "T003", fitterName: "Mr Yameen", clientName: "Downtown Apt", status: "posted", rating: 4, date: "2023-12-09" },

    // Older Data for Analytics
    { id: "R11", jobId: "J099", fitterId: "T001", fitterName: "Mr Alvin", clientName: "Old Town", status: "posted", rating: 5, date: "2023-11-28" },
    { id: "R12", jobId: "J098", fitterId: "T002", fitterName: "Mr Kashif", clientName: "Springs", status: "posted", rating: 3, date: "2023-11-25", comment: "Left a bit of mess." },
];

export const getReviewsByFitter = (fitterId: string) => {
    return mockReviews.filter((r) => r.fitterId === fitterId);
};

export const getReviewStats = () => {
    const stats = mockReviews.reduce((acc, review) => {
        if (!acc[review.fitterName]) {
            acc[review.fitterName] = { posted: 0, pending: 0, total: 0, totalRating: 0 };
        }
        acc[review.fitterName].total += 1;
        if (review.status === "posted") {
            acc[review.fitterName].posted += 1;
            acc[review.fitterName].totalRating += (review.rating || 0);
        } else {
            acc[review.fitterName].pending += 1;
        }
        return acc;
    }, {} as Record<string, { posted: number; pending: number; total: number; totalRating: number }>);

    return Object.entries(stats)
        .map(([name, counts]) => ({
            name,
            posted: counts.posted,
            pending: counts.pending,
            total: counts.total,
            conversionRate: Math.round((counts.posted / counts.total) * 100) || 0,
            avgRating: counts.posted > 0 ? (counts.totalRating / counts.posted).toFixed(1) : "N/A"
        }))
        .sort((a, b) => b.posted - a.posted);
};
