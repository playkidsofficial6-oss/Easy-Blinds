"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

export type FitterStatus = "On the way" | "In progress" | "Completed" | "Offline";

export interface FitterEvent {
    id: string;
    type: 'status_change' | 'check_in' | 'completion';
    action: string;
    time: string;
    location: string;
    coordinates: [number, number];
}

export interface FitterJob {
    id: string;
    client: string;
    address: string;
    time: string;
    status: "Pending" | "In Progress" | "Done";
    fabric?: string;
    rooms?: string[];
    notes?: string;
    coordinates?: [number, number];
}

export interface Fitter {
    id: string;
    name: string;
    jobRef: string;
    status: FitterStatus;
    location: [number, number]; // [lat, lng]
    lastUpdated: string;
    avatar?: string;
    history: FitterEvent[];
    schedule: {
        today: FitterJob[];
        yesterday: FitterJob[];
        tomorrow: FitterJob[];
        upcoming: FitterJob[];
    }
    currentJobStartTime?: number | null;
}

// Initial Mock Data with rich history
const INITIAL_FITTERS: Fitter[] = [
    {
        id: "1",
        name: "Mr Zishan", // Changed from Ahmed Hassan
        jobRef: "JOB-2024-001",
        status: "In progress",
        location: [25.1972, 55.2744],
        lastUpdated: "2m ago",
        currentJobStartTime: Date.now() - 1000 * 60 * 45, // Started 45 mins ago
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        history: [
            { id: 'e1', type: 'status_change', action: 'Started Journey', time: '09:30 AM', location: 'Al Quoz Warehouse', coordinates: [25.15, 55.23] },
            { id: 'e2', type: 'check_in', action: 'Arrived at Site', time: '10:15 AM', location: 'Burj Khalifa Entrance', coordinates: [25.1970, 55.2740] },
            { id: 'e3', type: 'status_change', action: 'Started Installation', time: '10:20 AM', location: 'Unit 1402', coordinates: [25.1972, 55.2744] }
        ],
        schedule: {
            yesterday: [
                { id: 'j-old-1', client: 'Villa 12', address: 'Palm Jumeirah', time: '09:00 AM', status: 'Done', fabric: 'Linen Sheer', rooms: ['Living Room', 'Master Bedroom'] },
                { id: 'j-old-2', client: 'Penthouse 4', address: 'Marina Gate', time: '02:00 PM', status: 'Done', fabric: 'Blackout Velvet', rooms: ['Cinema Room'] }
            ],
            today: [
                {
                    id: 'j-cur-1',
                    client: 'Burj Khalifa Unit 1402',
                    address: 'Downtown Dubai',
                    time: '10:00 AM',
                    status: 'In Progress',
                    fabric: 'Premium Silk',
                    rooms: ['Majlis', 'Dining Area', 'Guest Bedroom'],
                    notes: 'Client requested shoe covers. Access via service lift.',
                    coordinates: [25.1972, 55.2744]
                },
                {
                    id: 'j-cur-2',
                    client: 'Office 505',
                    address: 'Business Bay',
                    time: '03:00 PM',
                    status: 'Pending',
                    fabric: 'Roller Blinds',
                    rooms: ['Conference Room', 'Manager Office'],
                    coordinates: [25.1857, 55.2708]
                }
            ],
            tomorrow: [
                {
                    id: 'j-fut-1',
                    client: 'School Project',
                    address: 'Al Barsha',
                    time: '08:00 AM',
                    status: 'Pending',
                    fabric: 'Fire Retardant',
                    rooms: ['Auditorium', 'Library']
                }
            ],
            upcoming: [
                {
                    id: 'j-up-1',
                    client: 'Blue Waters Resort',
                    address: 'Blue Waters Island',
                    time: 'Scheduled',
                    status: 'Pending',
                    fabric: 'Outdoor Motorized',
                    rooms: ['Pool Deck']
                }
            ]
        }
    },
    {
        id: "2",
        name: "Mr Ikram", // Changed from John Smith
        jobRef: "JOB-2024-002",
        status: "On the way",
        location: [25.0773, 55.1388],
        lastUpdated: "5m ago",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        history: [
            { id: 'e4', type: 'status_change', action: 'Started Journey', time: '10:00 AM', location: 'JBL Warehouse', coordinates: [25.05, 55.12] }
        ],
        schedule: {
            yesterday: [],
            today: [
                { id: 'j-cur-3', client: 'JBR Apartment', address: 'JBR Walk', time: '10:30 AM', status: 'Pending', fabric: 'Sheer Curtains', rooms: ['Bedroom 1', 'Bedroom 2'] }
            ],
            tomorrow: [],
            upcoming: []
        }
    },
    {
        id: "3",
        name: "Mr Sulyman", // Changed from Sarah Parker (and updated avatar to male)
        jobRef: "JOB-2024-003",
        status: "Completed",
        location: [25.276987, 55.296249],
        lastUpdated: "1h ago",
        avatar: "https://randomuser.me/api/portraits/men/44.jpg", // Changed to men
        history: [
            { id: 'e5', type: 'status_change', action: 'Started Journey', time: '08:00 AM', location: 'Deira Office', coordinates: [25.27, 55.30] },
            { id: 'e6', type: 'completion', action: 'Job Completed', time: '09:45 AM', location: 'Gold Souk Area', coordinates: [25.2769, 55.2962] }
        ],
        schedule: {
            yesterday: [],
            today: [
                { id: 'j-cur-4', client: 'Gold Souk Shop', address: 'Deira', time: '08:30 AM', status: 'Done', fabric: 'Display Curtains', rooms: ['Showroom Front'] }
            ],
            tomorrow: [],
            upcoming: []
        }
    },
    {
        id: "4",
        name: "Mr Irtza", // Changed from Mohammad Ali
        jobRef: "JOB-2024-004",
        status: "On the way",
        location: [25.1124, 55.3904],
        lastUpdated: "12m ago",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        history: [],
        schedule: { yesterday: [], today: [], tomorrow: [], upcoming: [] }
    }
];

// Removed David Chen as we only have 4 specific names requested, but the mockup might want to keep the length consistent. 
// User asked to *change* fitter names. I will keep 4 as requested, and perhaps leave the 5th one as a generic if needed, 
// or remove it if I assume the user *only* wants these 4. 
// However, the prompt says "change fitters names to [list]", implying the list is exhaustive or matches the visible ones.
// I will keep the 5th one but maybe rename him to "Fleet Support" or remove him. 
// To be safe and clean, I will just stick to the 4 requested names for the primary view.
// Actually, looking at the previous file, there were 5 fitters. I will remove the 5th one or rename it if I had a name.
// Since I don't have a name for the 5th, I will remove it to avoid confusion.

const STORAGE_KEY = "eb_live_fitters_v3"; // Bumped version to v3 to force cache invalidation

// ... rest of the file logic remains exactly the same ...
export function useLiveFitters() {
    const [fitters, setFitters] = useState<Fitter[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage or set initial
    useEffect(() => {
        const loadData = () => {
            if (typeof window === "undefined") return;

            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setFitters(JSON.parse(stored));
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FITTERS));
                setFitters(INITIAL_FITTERS);
            }
            setIsLoaded(true);
        };

        loadData();

        // Listen for storage events (cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setFitters(JSON.parse(e.newValue));
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Update status function with simulated GPS movement and logging
    const updateFitterStatus = useCallback((fitterId: string, status: FitterStatus) => {
        setFitters((prev) => {
            const updated = prev.map((f) => {
                if (f.id === fitterId) {
                    // Simulate 0.001 degree shift (~100m) to show movement tracking
                    const newLat = f.location[0] + (Math.random() - 0.5) * 0.002;
                    const newLng = f.location[1] + (Math.random() - 0.5) * 0.002;
                    const newCoords: [number, number] = [newLat, newLng];

                    const now = new Date();
                    const timeString = format(now, 'hh:mm a');

                    const newEvent: FitterEvent = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'status_change',
                        action: `Status changed to ${status}`,
                        time: timeString,
                        location: 'Tracking Update',
                        coordinates: newCoords
                    };

                    let newStartTime = f.currentJobStartTime;
                    if (status === 'In progress') {
                        newStartTime = Date.now();
                    } else if (status === 'Completed' || status === 'On the way') {
                        newStartTime = null;
                    }

                    return {
                        ...f,
                        status,
                        location: newCoords,
                        lastUpdated: "Just now",
                        currentJobStartTime: newStartTime,
                        history: [newEvent, ...f.history] // Append to history
                    };
                }
                return f;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { fitters, updateFitterStatus, isLoaded };
}
