// Status for Workload Analytics
export type FitterStatus = "Busy" | "Free" | "On-site" | "Travelling" | "Leave";

export type JobStatus = "Installation In Progress" | "Ready for Installation" | "Pending Team" | "Scheduled" | "Completed";
export type JobPriority = "High" | "Medium" | "Low";
export type ReviewStatus = "received" | "pending" | "none";

export interface InstallationJob {
    id: string;
    client: string;
    area: string;
    property: string;
    status: JobStatus;
    team: string; // The fitter assigned
    brand?: string;
    scheduled: string; // YYYY-MM-DD
    time?: string;
    whatsapp?: string;
    value: number;
    priority: JobPriority;

    // Workload & Analytics Fields
    fitterStatus?: FitterStatus; // Snapshot status for "Right Now" analytics
    duration?: number; // Minutes
    plannedDuration?: number; // Minutes

    // Review Correlation
    reviewStatus: ReviewStatus;
    reviewRating?: number;
    reviewDate?: string;
    reviewProofUrl?: string; // Image URL
    reviewComment?: string;
}

export const MOCK_JOBS: InstallationJob[] = [
    {
        id: "J001",
        client: "Ahmed Al Mansoori",
        area: "Jumeirah Park",
        property: "Villa",
        status: "Installation In Progress",
        team: "Mr Alvin",
        brand: "Easy Blinds",
        scheduled: "2024-01-20",
        time: "10:00",
        whatsapp: "+971501234567",
        value: 12500,
        priority: "High",
        fitterStatus: "On-site",
        duration: 240,
        plannedDuration: 180,
        reviewStatus: "pending"
    },
    {
        id: "J002",
        client: "Sarah Smith",
        area: "Dubai Marina",
        property: "Apartment",
        status: "Ready for Installation",
        team: "Mr Kashif",
        brand: "My Thread",
        scheduled: "2024-01-22",
        value: 8300,
        priority: "Medium",
        fitterStatus: "Travelling",
        reviewStatus: "none",
        plannedDuration: 120
    },
    {
        id: "J003",
        client: "Emaar Properties",
        area: "Downtown Dubai",
        property: "Office",
        status: "Ready for Installation",
        team: "Unassigned",
        brand: "Oceana",
        scheduled: "2024-01-23",
        value: 45000,
        priority: "High",
        reviewStatus: "none"
    },
    {
        id: "J004",
        client: "Palm Hotel",
        area: "Palm Jumeirah",
        property: "Hotel",
        status: "Scheduled",
        team: "Mr Kashif",
        brand: "Hillarys",
        scheduled: "2024-01-25",
        value: 82000,
        priority: "High",
        reviewStatus: "none",
        plannedDuration: 480
    },
    {
        id: "J005",
        client: "John Brown",
        area: "Springs 4",
        property: "Villa",
        status: "Pending Team",
        team: "Unassigned",
        brand: "Easy Blinds",
        scheduled: "2024-01-26",
        value: 5600,
        priority: "Low",
        reviewStatus: "none"
    },
    {
        id: "J006",
        client: "City Walk Cafe",
        area: "City Walk",
        property: "Retail",
        status: "Completed",
        team: "Mr Yameen",
        brand: "Oceana",
        scheduled: "2024-01-18",
        value: 15400,
        priority: "Medium",
        fitterStatus: "Free",
        duration: 150,
        plannedDuration: 180,
        reviewStatus: "received",
        reviewRating: 5,
        reviewDate: "2024-01-18",
        reviewComment: "Team was very professional and clean.",
        reviewProofUrl: "/proof/review-j006.jpg"
    },
    {
        id: "J007",
        client: "Marina View Apt",
        area: "Dubai Marina",
        property: "Apartment",
        status: "Completed",
        team: "Mr Alvin",
        brand: "My Thread",
        scheduled: "2024-01-15",
        value: 4200,
        priority: "Low",
        fitterStatus: "On-site", // Currently on another job
        duration: 90,
        plannedDuration: 90,
        reviewStatus: "received",
        reviewRating: 4.8,
        reviewDate: "2024-01-15",
        reviewComment: "Great job, quick installation.",
        reviewProofUrl: "/proof/review-j007.jpg"
    },
    {
        id: "J008",
        client: "Blue Waters Res",
        area: "Blue Waters",
        property: "Apartment",
        status: "Completed",
        team: "Mr Kashif",
        brand: "Hillarys",
        scheduled: "2024-01-14",
        value: 7800,
        priority: "Medium",
        duration: 130,
        plannedDuration: 120,
        reviewStatus: "pending" // Completed but no review
    },
    {
        id: "J009",
        client: "James Wilson",
        area: "Arabian Ranches",
        property: "Villa",
        status: "Completed",
        team: "Mr Yameen",
        brand: "Easy Blinds",
        scheduled: "2024-01-12",
        value: 18900,
        priority: "High",
        duration: 300,
        plannedDuration: 240,
        reviewStatus: "received",
        reviewRating: 4.2,
        reviewDate: "2024-01-13",
        reviewComment: "Good work but came late.",
        reviewProofUrl: "/proof/review-j009.jpg"
    }
];
