"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Phone, Mail, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Lead, LeadStatus } from "@/types/lead";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MOCK_LEADS: Lead[] = [
    {
        id: "L-101",
        customerName: "Sarah Johnson",
        phone: "+971 50 123 4567",
        email: "sarah.j@example.com",
        source: "Website",
        interest: "Roller Blinds for Villa",
        area: "Arabian Ranches",
        status: "New",
        createdAt: new Date("2025-12-08T09:00:00"),
    },
    {
        id: "L-102",
        customerName: "Mohammed Al Qasimi",
        phone: "+971 55 987 6543",
        source: "Showroom",
        interest: "Full Home Curtains",
        area: "Jumeirah 1",
        status: "Contacted",
        assignedTo: "John Doe",
        createdAt: new Date("2025-12-07T14:30:00"),
        lastContacted: new Date("2025-12-08T10:00:00"),
    },
    {
        id: "L-103",
        customerName: "Design Studio LLC",
        phone: "+971 4 444 4444",
        email: "info@designstudio.ae",
        source: "Referral",
        interest: "Office Blinds Project",
        area: "Business Bay",
        status: "Appointment Scheduled",
        assignedTo: "Jane Smith",
        createdAt: new Date("2025-12-06T11:15:00"),
    }
];

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Contacted': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Appointment Scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Qualified': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Lost': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newLead: Lead = {
            id: `L-${100 + leads.length + 1}`,
            customerName: formData.get('name') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
            source: formData.get('source') as Lead['source'],
            interest: formData.get('interest') as string,
            area: formData.get('area') as string,
            status: 'New',
            createdAt: new Date(),
        };
        setLeads([newLead, ...leads]);
        setIsAddOpen(false);
    };

    const filteredLeads = leads.filter(l =>
        l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm) ||
        l.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light text-neutral-900 dark:text-white">Lead Management</h1>
                    <p className="text-neutral-500 mt-1">Track and assign new inquiries</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddLead} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Customer Name</Label>
                                <Input id="name" name="name" required placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" required placeholder="+971..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email (Optional)</Label>
                                    <Input id="email" name="email" type="email" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="area">Area/Location</Label>
                                    <Input id="area" name="area" required placeholder="e.g. Dubai Marina" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Select name="source" defaultValue="Website">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Website">Website</SelectItem>
                                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                            <SelectItem value="Phone">Phone</SelectItem>
                                            <SelectItem value="Showroom">Showroom</SelectItem>
                                            <SelectItem value="Referral">Referral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interest">Interest/Requirement</Label>
                                <Textarea id="interest" name="interest" placeholder="e.g. Curtains for 3 bedrooms..." />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Lead</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search leads..."
                        className="pl-10 border-0 bg-neutral-100 dark:bg-neutral-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Leads Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredLeads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-medium text-lg text-neutral-900 dark:text-white">{lead.customerName}</h3>
                                        <Badge variant="outline" className={`${getStatusColor(lead.status)} border-0`}>
                                            {lead.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.area}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {lead.createdAt.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-4 h-4 text-neutral-600" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-md">
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">
                                        <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-2">Interest:</span>
                                        {lead.interest}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex gap-4">
                                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors">
                                            <Phone className="w-4 h-4" /> {lead.phone}
                                        </a>
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors">
                                                <Mail className="w-4 h-4" /> Email
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                                        Via {lead.source}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
