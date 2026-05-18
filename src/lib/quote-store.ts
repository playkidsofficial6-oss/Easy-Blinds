"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

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
    measurementId?: string; 
    jobId?: string;
    salesmanId?: string;
    salesmanName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
    total: number;
    status: QuoteStatus;
    date: string; 
    sentDate?: string;
    items?: QuoteItem[];
}

export function useQuotes() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const loadQuotes = useCallback(async () => {
        try {
            const { data } = await api.get<Quote[]>('/quotes');
            setQuotes(data);
        } catch (error) {
            console.error("Failed to load quotes", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        loadQuotes();
    }, [loadQuotes]);

    const addQuote = useCallback(async (quote: Omit<Quote, "id" | "date">) => {
        const newQuoteData = {
            ...quote,
            id: `Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            date: new Date().toISOString(),
        };
        try {
            const { data } = await api.post<Quote>('/quotes', newQuoteData);
            setQuotes(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error("Failed to add quote", error);
            throw error;
        }
    }, []);

    const updateQuoteStatus = useCallback(async (id: string, status: QuoteStatus) => {
        try {
            const { data } = await api.patch<Quote>(`/quotes/${id}/status`, { status });
            setQuotes(prev => prev.map(q => q.id === id ? data : q));
        } catch (error) {
            console.error("Failed to update quote status", error);
        }
    }, []);

    const deleteQuote = useCallback(async (id: string) => {
        try {
            await api.delete(`/quotes/${id}`);
            setQuotes(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            console.error("Failed to delete quote", error);
        }
    }, []);

    const getStats = useCallback(() => {
        const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
        const approvedCount = quotes.filter(q => q.status === 'Approved').length;
        const pendingCount = quotes.filter(q => q.status === 'Sent' || q.status === 'Negotiation').length;
        return { totalCount: quotes.length, totalValue, approvedCount, pendingCount };
    }, [quotes]);

    return { quotes, isLoaded, addQuote, updateQuoteStatus, deleteQuote, getStats, refreshQuotes: loadQuotes };
}
