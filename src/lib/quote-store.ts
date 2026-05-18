"use client";

import { useState, useEffect, useCallback } from "react";

export type QuoteStatus = "Approved" | "Sent" | "Negotiation" | "Rejected" | "Draft";

export interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Quote {
    id: string;
    client: string;
    measurementId?: string; // Optional link to measurement
    jobId?: string;
    salesmanId?: string;
    salesmanName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
    total: number;
    status: QuoteStatus;
    date: string; // ISO Date string
    sentDate?: string;
    items?: QuoteItem[];
}

const STORAGE_KEY = "eb_field_quotes_v1";

const INITIAL_QUOTES: Quote[] = [
    {
        id: "Q001",
        client: "Ahmed Al Mansoori",
        measurementId: "M001",
        total: 12500,
        status: "Approved",
        date: "2024-01-15",
        sentDate: "2024-01-16",
    },
    {
        id: "Q002",
        client: "Sarah Smith",
        measurementId: "M002",
        total: 8300,
        status: "Sent",
        date: "2024-01-16",
        sentDate: "2024-01-17",
    },
    {
        id: "Q003",
        client: "Emaar Properties",
        measurementId: "M003",
        total: 25600,
        status: "Negotiation",
        date: "2024-01-16",
        sentDate: "2024-01-17",
    },
    {
        id: "Q004",
        client: "Villa 124",
        measurementId: "M004",
        total: 15200,
        status: "Draft",
        date: "2024-01-17",
    },
];

function getInitialQuotes() {
    if (typeof window === "undefined") return INITIAL_QUOTES;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored) as Quote[];
        } catch (error) {
            console.error("Failed to parse stored quotes", error);
            return INITIAL_QUOTES;
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUOTES));
    return INITIAL_QUOTES;
}

export function useQuotes() {
    const [quotes, setQuotes] = useState<Quote[]>(getInitialQuotes);
    const [isLoaded, setIsLoaded] = useState(false);

    //Load initial data
    useEffect(() => {
        const timer = window.setTimeout(() => setIsLoaded(true), 0);
        return () => window.clearTimeout(timer);
    }, []);

    const saveQuotes = (newQuotes: Quote[]) => {
        setQuotes(newQuotes);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuotes));
        }
    };

    const addQuote = useCallback((quote: Omit<Quote, "id" | "date">) => {
        const newQuote: Quote = {
            ...quote,
            id: `Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Simple ID generation
            date: new Date().toISOString(),
        };
        saveQuotes([newQuote, ...quotes]);
        return newQuote;
    }, [quotes]);

    const updateQuoteStatus = useCallback((id: string, status: QuoteStatus) => {
        const updated = quotes.map(q => q.id === id ? { ...q, status } : q);
        saveQuotes(updated);
    }, [quotes]);

    const deleteQuote = useCallback((id: string) => {
        const updated = quotes.filter(q => q.id !== id);
        saveQuotes(updated);
    }, [quotes]);

    const getStats = useCallback(() => {
        const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
        const approvedCount = quotes.filter(q => q.status === 'Approved').length;
        const pendingCount = quotes.filter(q => q.status === 'Sent' || q.status === 'Negotiation').length;
        return { totalCount: quotes.length, totalValue, approvedCount, pendingCount };
    }, [quotes]);

    return { quotes, isLoaded, addQuote, updateQuoteStatus, deleteQuote, getStats };
}
