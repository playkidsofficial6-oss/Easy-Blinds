export interface StitchingJob {
    id: string;
    orderId: string;
    client: string;
    brand: "Easy Blinds" | "My Thread" | "Oceana" | "Hillarys";
    type: "Curtain" | "Roman Blind" | "Cushion" | "Alteration";
    fabric: string;
    dimensions: string;
    status: "Pending" | "Cutting" | "Stitching" | "Quality Check" | "Ready";
    assignedTo: string; // Tailor Name
    priority: "Normal" | "High" | "Urgent";
    dueDate: string;
    notes?: string;
}

export const MOCK_STITCHING_TEAM = [
    { id: "S001", name: "Master Kumar", role: "Head Tailor", status: "Active" },
    { id: "S002", name: "Arif Khan", role: "Tailor", status: "Active" },
    { id: "S003", name: "Sarah Joy", role: "Quality Control", status: "Active" },
];

export const MOCK_STITCHING_JOBS: StitchingJob[] = [
    {
        id: "ST-101",
        orderId: "ORD-5501",
        client: "Villa 32 - Jumeirah",
        brand: "Easy Blinds",
        type: "Curtain",
        fabric: "Velvet Royals - Blue",
        dimensions: "300x280 cm (2 Panels)",
        status: "Stitching",
        assignedTo: "Master Kumar",
        priority: "High",
        dueDate: "2024-02-15",
        notes: "Double pinch pleat required."
    },
    {
        id: "ST-102",
        orderId: "ORD-5502",
        client: "Mr. Smith Apt",
        brand: "My Thread",
        type: "Roman Blind",
        fabric: "Linen Pure - White",
        dimensions: "120x160 cm",
        status: "Cutting",
        assignedTo: "Arif Khan",
        priority: "Normal",
        dueDate: "2024-02-18"
    },
    {
        id: "ST-103",
        orderId: "ORD-5505",
        client: "Penthouse 5B",
        brand: "Oceana",
        type: "Cushion",
        fabric: "Silk Mix - Gold",
        dimensions: "45x45 cm (6 pcs)",
        status: "Pending",
        assignedTo: "Unassigned",
        priority: "Urgent",
        dueDate: "2024-02-14",
        notes: "Zip must be concealed."
    },
    {
        id: "ST-104",
        orderId: "ORD-5499",
        client: "Downtown Office",
        brand: "Hillarys",
        type: "Alteration",
        fabric: "Existing Curtains",
        dimensions: "Shorten by 10cm",
        status: "Quality Check",
        assignedTo: "Sarah Joy",
        priority: "Normal",
        dueDate: "2024-02-13"
    },
    {
        id: "ST-105",
        orderId: "ORD-5510",
        client: "Palm Villa 12",
        brand: "Easy Blinds",
        type: "Curtain",
        fabric: "Sheer Voile",
        dimensions: "500x300 cm",
        status: "Pending",
        assignedTo: "Master Kumar",
        priority: "High",
        dueDate: "2024-02-20"
    }
];
