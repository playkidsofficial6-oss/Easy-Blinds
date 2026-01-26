// Status for Workload Analytics
export type FitterStatus = "Busy" | "Free" | "On-site" | "Travelling" | "Leave";

export type JobStatus = "Installation In Progress" | "Ready for Installation" | "Pending Team" | "Scheduled" | "Completed";
export type JobPriority = "High" | "Medium" | "Low";
export type ReviewStatus = "received" | "pending" | "none";

export interface InstallationJob {
    id: string;
    client: string;
    email: string; // Added email
    phone: string; // Added phone
    area: string;
    address?: string; // Full detailed address
    property: string;
    status: JobStatus;
    team: string; // The fitter assigned
    brand?: string;
    scheduled: string; // YYYY-MM-DD
    time?: string;
    whatsapp?: string;
    value: number;
    priority: JobPriority;
    coordinates?: [number, number]; // Added coordinates
    productType?: "Curtains" | "Blinds" | "Shutters" | "Awning";

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
        email: "ahmed.m@example.com",
        phone: "+971 50 123 4567",
        area: "Jumeirah Park",
        address: "Villa 14, Dist 7, Jumeirah Park, Dubai",
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
        reviewStatus: "pending",
        productType: "Curtains",
        coordinates: [25.0441, 55.1522] // Jumeirah Park
    },
    {
        id: "J002",
        client: "Sarah Smith",
        email: "sarah.smith@example.com",
        phone: "+971 55 987 6543",
        area: "Dubai Marina",
        address: "Apt 2201, Marina Gate 1, Dubai Marina, Dubai",
        property: "Apartment",
        status: "Ready for Installation",
        team: "Mr Kashif",
        brand: "My Thread",
        scheduled: "2024-01-22",
        value: 8300,
        priority: "Medium",
        fitterStatus: "Travelling",
        reviewStatus: "none",
        plannedDuration: 120,
        productType: "Blinds",
        coordinates: [25.0868, 55.1450] // Dubai Marina
    },
    {
        id: "J003",
        client: "Emaar Properties",
        email: "contact@emaar.ae",
        phone: "+971 4 367 3333",
        area: "Downtown Dubai",
        address: "Office 404, Building 3, Emaar Square, Downtown Dubai",
        property: "Office",
        status: "Ready for Installation",
        team: "Unassigned",
        brand: "Oceana",
        scheduled: "2024-01-23",
        value: 45000,
        priority: "High",
        reviewStatus: "none",
        productType: "Curtains",
        coordinates: [25.1972, 55.2744] // Downtown
    },
    {
        id: "J004",
        client: "Palm Hotel",
        email: "maintenance@palmhotel.com",
        phone: "+971 4 111 2222",
        area: "Palm Jumeirah",
        address: "Palm Hotel Resort, Crescent Rd, Palm Jumeirah, Dubai",
        property: "Hotel",
        status: "Scheduled",
        team: "Mr Kashif",
        brand: "Hillarys",
        scheduled: "2024-01-25",
        value: 82000,
        priority: "High",
        reviewStatus: "none",
        plannedDuration: 480,
        productType: "Blinds",
        coordinates: [25.1124, 55.1390] // Palm Jumeirah
    },
    {
        id: "J005",
        client: "John Brown",
        email: "john.brown@example.com",
        phone: "+971 52 555 1234",
        area: "Springs 4",
        address: "Villa 32, St 5, Springs 4, Emirates Living, Dubai",
        property: "Villa",
        status: "Pending Team",
        team: "Unassigned",
        brand: "Easy Blinds",
        scheduled: "2024-01-26",
        value: 5600,
        priority: "Low",
        reviewStatus: "none",
        productType: "Shutters",
        coordinates: [25.0487, 55.1765] // Springs 
    },
    {
        id: "J006",
        client: "City Walk Cafe",
        email: "manager@citywalkcafe.com",
        phone: "+971 4 222 3333",
        area: "City Walk",
        address: "Unit 12, City Walk Phase 2, Al Wasl, Dubai",
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
        reviewProofUrl: "/proof/review-j006.jpg",
        productType: "Awning",
        coordinates: [25.2073, 55.2577] // City Walk
    },
    {
        id: "J007",
        client: "Marina View Apt",
        email: "admin@marinaview.com",
        phone: "+971 4 444 5555",
        area: "Dubai Marina",
        address: "Apt 505, Canal Front Residence 7B, Dubai Marina",
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
        reviewProofUrl: "/proof/review-j007.jpg",
        productType: "Curtains",
        coordinates: [25.0868, 55.1450]
    },
    {
        id: "J008",
        client: "Blue Waters Res",
        email: "concierge@bluewaters.ae",
        phone: "+971 4 888 9999",
        area: "Blue Waters",
        address: "Bldg 4, Blue Waters Island, Dubai",
        property: "Apartment",
        status: "Completed",
        team: "Mr Kashif",
        brand: "Hillarys",
        scheduled: "2024-01-14",
        value: 7800,
        priority: "Medium",
        duration: 130,
        plannedDuration: 120,
        reviewStatus: "pending",
        productType: "Blinds",
        coordinates: [25.0788, 55.1235] // Blue Waters
    },
    {
        id: "J009",
        client: "James Wilson",
        email: "james.wilson@example.com",
        phone: "+971 58 123 7890",
        area: "Arabian Ranches",
        address: "Villa 89, Saheel Gate 1, Arabian Ranches, Dubai",
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
        reviewProofUrl: "/proof/review-j009.jpg",
        productType: "Curtains",
        coordinates: [25.0298, 55.2917] // Arabian Ranches
    }
];
