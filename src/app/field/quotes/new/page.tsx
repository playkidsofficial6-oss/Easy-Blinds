"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { useQuotes, QuoteStatus } from "@/lib/quote-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const quoteSchema = z.object({
    client: z.string().min(2, "Client name is required"),
    total: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Total must be a positive number"),
    measurementId: z.string().optional(),
    status: z.enum(["Draft", "Sent", "Approved", "Negotiation", "Rejected"]),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export default function NewQuotePage() {
    const { addQuote } = useQuotes();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            client: "",
            total: "",
            measurementId: "",
            status: "Draft",
        },
    });

    function onSubmit(values: QuoteFormValues) {
        setIsSubmitting(true);
        try {
            addQuote({
                client: values.client,
                total: Number(values.total),
                measurementId: values.measurementId || undefined,
                status: values.status as QuoteStatus,
            });
            toast.success("Quote created successfully");
            router.push("/field/quotes");
        } catch (error) {
            toast.error("Failed to create quote");
            console.error(error);
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/field/quotes">
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-light text-neutral-900">New Quote</h1>
                    <p className="text-sm text-neutral-500">Create a new quotation for a client</p>
                </div>
            </div>

            <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="client"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Ahmed Al Mansoori" className="h-12 text-base" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="total"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Value (AED)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" className="h-12 font-mono text-base" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Initial Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Draft">Draft</SelectItem>
                                                    <SelectItem value="Sent">Sent</SelectItem>
                                                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                                                    <SelectItem value="Approved">Approved</SelectItem>
                                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="measurementId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Measurement ID (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. M001" className="h-12 font-mono text-sm" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <Link href="/field/quotes">
                                    <Button type="button" variant="outline" className="h-12 px-6">Cancel</Button>
                                </Link>
                                <Button type="submit" className="h-12 px-8 bg-neutral-900 hover:bg-neutral-800" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Create Quote
                                </Button>
                            </div>

                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
