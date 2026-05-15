"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

export type FitterStatus = "On the way" | "In progress" | "Completed" | "Offline" | "Fully Booked" | "Available";

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
    time: string; // Start time e.g. "08:00"
    endTime: string; // Calculated (Start + 2hrs)
    status: "Pending" | "In Progress" | "Done";
    fabric?: string;
    rooms?: string[];
    coordinates?: [number, number];
    // Rich Data Fields
    value?: number;
    email?: string;
    phone?: string;
    notes?: string;
    brand?: string;
    property?: string;
    productType?: "Curtains" | "Blinds" | "Shutters" | "Awning";
    priority?: "High" | "Medium" | "Low";
}

export interface Fitter {
    id: string;
    name: string;
    jobRef: string;
    status: FitterStatus;
    location: [number, number];
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

    // Smart Capacity Fields
    capacity: {
        max: number; // 5
        current: number; // calculated
        remaining: number;
    };
    nextAvailableSlot: string; // e.g. "14:00" or "None"
}

// Helper to generate slots: 08:00, 10:00, 12:00, 14:00, 16:00
const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];

const INITIAL_FITTERS: Fitter[] = [
    {
        id: "1",
        name: "Mr Zishan",
        jobRef: "JOB-2024-001",
        status: "In progress", // Currently working
        location: [25.1972, 55.2744],
        lastUpdated: "2m ago",
        currentJobStartTime: Date.now() - 1000 * 60 * 45,
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        history: [],
        schedule: {
            yesterday: [],
            today: [
                { id: 'j1', client: 'Burj Khalifa', address: 'Downtown Dubai', time: '08:00', endTime: '10:00', status: 'Done', coordinates: [25.1970, 55.2740], value: 15000, email: "admin@burj.ae", phone: "+971 4 888 8888", brand: "Oceana", property: "Commercial", productType: "Blinds", priority: "High" },
                { id: 'j2', client: 'Villa 14', address: 'Villa 14, Dist 7, Jumeirah Park', time: '10:00', endTime: '12:00', status: 'In Progress', coordinates: [25.1972, 55.2744], value: 12500, email: "owner@villa14.com", phone: "+971 50 123 4567", brand: "Easy Blinds", property: "Villa", productType: "Curtains", priority: "Medium" }
            ],
            tomorrow: [],
            upcoming: []
        },
        capacity: { max: 5, current: 2, remaining: 3 },
        nextAvailableSlot: "12:00"
    },
    {
        id: "2",
        name: "Mr Ikram",
        jobRef: "JOB-2024-002",
        status: "On the way",
        location: [25.0773, 55.1388],
        lastUpdated: "5m ago",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        history: [],
        schedule: {
            yesterday: [],
            today: [
                { id: 'j3', client: 'Marina Apt', address: 'Apt 2201, Marina Gate 1, Dubai Marina', time: '10:00', endTime: '12:00', status: 'Pending', coordinates: [25.0773, 55.1388], value: 8300, email: "sarah@example.com", phone: "+971 55 987 6543", brand: "My Thread", property: "Apartment", productType: "Blinds", priority: "Low" }
            ],
            tomorrow: [],
            upcoming: []
        },
        capacity: { max: 5, current: 1, remaining: 4 },
        nextAvailableSlot: "12:00" // Assuming 08:00 passed or skipped
    },
    {
        id: "3",
        name: "Mr Sulyman",
        jobRef: "JOB-2024-003",
        status: "Fully Booked", // Logic test
        location: [25.2769, 55.2962],
        lastUpdated: "1h ago",
        avatar: "https://randomuser.me/api/portraits/men/44.jpg",
        history: [],
        schedule: {
            yesterday: [],
            today: [
                { id: 'j4', client: 'Job A', address: 'Deira', time: '08:00', endTime: '10:00', status: 'Done' },
                { id: 'j5', client: 'Job B', address: 'Deira', time: '10:00', endTime: '12:00', status: 'Done' },
                { id: 'j6', client: 'Job C', address: 'Deira', time: '12:00', endTime: '14:00', status: 'In Progress' },
                { id: 'j7', client: 'Job D', address: 'Deira', time: '14:00', endTime: '16:00', status: 'Pending' },
                { id: 'j8', client: 'Job E', address: 'Deira', time: '16:00', endTime: '18:00', status: 'Pending' }
            ],
            tomorrow: [],
            upcoming: []
        },
        capacity: { max: 5, current: 5, remaining: 0 },
        nextAvailableSlot: "None"
    },
    {
        id: "4",
        name: "Mr Irtza",
        jobRef: "--",
        status: "Available", // Free
        location: [25.1124, 55.3904],
        lastUpdated: "Just now",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        history: [],
        schedule: { yesterday: [], today: [], tomorrow: [], upcoming: [] },
        capacity: { max: 5, current: 0, remaining: 5 },
        nextAvailableSlot: "10:00" // Assuming current time allows
    }
];

const STORAGE_KEY = "eb_live_fitters_v4"; // Bump payload version

export function useLiveFitters() {
    const [fitters, setFitters] = useState<Fitter[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setFitters(JSON.parse(stored));
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FITTERS));
            setFitters(INITIAL_FITTERS);
        }
        setIsLoaded(true);
    }, []);

    const updateFitterStatus = useCallback((fitterId: string, status: FitterStatus) => {
        setFitters((currentFitters) => {
            const nextFitters = currentFitters.map((fitter) =>
                fitter.id === fitterId
                    ? {
                          ...fitter,
                          status,
                          lastUpdated: "Just now",
                      }
                    : fitter,
            );

            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFitters));
            }

            return nextFitters;
        });
    }, []);

    return { fitters, updateFitterStatus, isLoaded };
}
