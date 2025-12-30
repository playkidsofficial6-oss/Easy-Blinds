export const MOCK_TEAM = [
    {
        id: "T001",
        name: "Mr Alvin",
        role: "Senior Fitter",
        avatar: "/placeholder.jpg",
        todayVisits: 3,
        completedToday: 2,
        upcomingVisits: [],
        totalCompleted: 154,
        phone: "+971 50 123 4567",
        status: "Busy",
        currentJob: "J001",
        location: "Jumeirah Park",
        rating: 4.9,
        onTimeRate: 98,
        reviews: 124,
        schedule: {
            history: [
                { id: "J-H1", client: "Sarah Jenkins", area: "Dubai Marina", status: "Completed", time: "09:00 AM", date: "2023-12-08", type: "Installation" },
                { id: "J-H2", client: "Mike Ross", area: "JLT", status: "Completed", time: "02:00 PM", date: "2023-12-07", type: "Measurement" },
                { id: "J-H3", client: "Palm Hotel", area: "Palm Jumeirah", status: "Completed", time: "11:00 AM", date: "2023-12-06", type: "Repair" }
            ],
            today: [
                { id: "J-T1", client: "Ahmed Al Mansoori", area: "Jumeirah Park", status: "In Progress", time: "10:00 AM", date: "Today", type: "Installation" },
                { id: "J-T2", client: "Villa 42", area: "Springs 4", status: "Scheduled", time: "03:00 PM", date: "Today", type: "Measurement" }
            ],
            upcoming: [
                { id: "J-U1", client: "Emaar Sales Centre", area: "Downtown", status: "Scheduled", time: "09:00 AM", date: "2023-12-10", type: "Installation" },
                { id: "J-U2", client: "Blue Waters Res", area: "Bluewaters", status: "Scheduled", time: "01:00 PM", date: "2023-12-11", type: "Repair" }
            ]
        }
    },
    {
        id: "T002",
        name: "Mr Kashif",
        role: "Fitter",
        avatar: "/placeholder.jpg",
        todayVisits: 2,
        completedToday: 1,
        upcomingVisits: [],
        totalCompleted: 98,
        phone: "+971 55 987 6543",
        status: "Available",
        location: "Al Quoz Warehouse",
        rating: 4.7,
        onTimeRate: 92,
        reviews: 85,
        schedule: {
            history: [
                { id: "K-H1", client: "Marina Heights", area: "Dubai Marina", status: "Completed", time: "10:00 AM", date: "2023-12-08", type: "Installation" }
            ],
            today: [
                { id: "K-T1", client: "Al Quoz Warehouse", area: "Al Quoz", status: "Completed", time: "08:00 AM", date: "Today", type: "Stock Pickup" },
                { id: "K-T2", client: "City Walk Apta", area: "City Walk", status: "Scheduled", time: "02:00 PM", date: "Today", type: "Installation" }
            ],
            upcoming: [
                { id: "K-U1", client: "Design District", area: "D3", status: "Scheduled", time: "11:00 AM", date: "2023-12-10", type: "Measurement" }
            ]
        }
    },
    {
        id: "T003",
        name: "Mr Yameen",
        role: "Fitter",
        avatar: "/placeholder.jpg",
        todayVisits: 4,
        completedToday: 3,
        upcomingVisits: [],
        totalCompleted: 112,
        phone: "+971 52 345 6789",
        status: "Off Duty",
        location: "N/A",
        rating: 4.8,
        onTimeRate: 95,
        reviews: 96,
        schedule: {
            history: [
                { id: "Y-H1", client: "Old Town Villa", area: "Downtown", status: "Completed", time: "09:00 AM", date: "2023-12-07", type: "Installation" },
                { id: "Y-H2", client: "Business Bay Tower", area: "Business Bay", status: "Completed", time: "01:00 PM", date: "2023-12-07", type: "Repair" }
            ],
            today: [],
            upcoming: [
                { id: "Y-U1", client: "Creek Harbour", area: "Dubai Creek", status: "Scheduled", time: "10:00 AM", date: "2023-12-11", type: "Installation" }
            ]
        }
    },
];
