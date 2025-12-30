export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Negotiation' | 'Rejected';

export interface QuoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Quote {
    id: string;
    measurementId: string;
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    lineItems: QuoteLineItem[];
    subtotal: number;
    discount: number;
    vat: number; // 5% in Dubai
    total: number;
    status: QuoteStatus;
    createdAt: Date;
    sentAt?: Date;
    approvedAt?: Date;
    notes?: string;
}

export type JobStatus =
    | 'Measurement Scheduled'
    | 'Measurement Completed'
    | 'Quote Approved'
    | 'Ready for Installation'
    | 'Installation In Progress'
    | 'Installed'
    | 'Closed';

export interface Job {
    id: string;
    clientName: string;
    area: string;
    propertyType: string;
    status: JobStatus;
    measurementTeam?: string;
    installationTeam?: string;
    scheduledDate?: Date;
    deadline?: Date;
    priority: 'Low' | 'Medium' | 'High';
    totalValue: number;
}
