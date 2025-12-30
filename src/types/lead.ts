export type LeadStatus = 'New' | 'Contacted' | 'Appointment Scheduled' | 'Qualified' | 'Lost';

export interface Lead {
    id: string;
    customerName: string;
    phone: string;
    email?: string;
    source: 'Website' | 'WhatsApp' | 'Phone' | 'Showroom' | 'Referral';
    interest: string; // e.g., "Curtains for Living Room"
    area: string;
    status: LeadStatus;
    notes?: string;
    createdAt: Date;
    assignedTo?: string; // Salesperson ID/Name
    lastContacted?: Date;
}
