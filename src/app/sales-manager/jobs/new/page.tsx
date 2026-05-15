"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createJob, getJobErrorMessage, type JobPriority } from "@/lib/jobs";

function buildScheduledAt(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  const dateValue = typeof date === "string" ? date : "";
  const timeValue = typeof time === "string" && time ? time : "09:00";

  if (!dateValue) {
    return undefined;
  }

  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get("quantity") || 1);

    try {
      await createJob({
        customerName: String(formData.get("customerName") || "").trim(),
        customerEmail: String(formData.get("customerEmail") || "").trim(),
        customerPhone: String(formData.get("customerPhone") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        productType: String(formData.get("productType") || "").trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        priority: String(formData.get("priority") || "medium") as JobPriority,
        status: "pending",
        notes: String(formData.get("notes") || "").trim() || undefined,
        scheduledAt: buildScheduledAt(formData.get("scheduledDate"), formData.get("scheduledTime")),
      });

      toast.success("Job created and saved successfully.");
      router.push("/sales-manager/assignments");
      router.refresh();
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to create job in MongoDB."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/sales-manager/assignments" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-stone-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-light text-stone-900 dark:text-white">New Job</h1>
          <p className="text-stone-500 dark:text-neutral-400">Create a new job.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" name="customerName" required minLength={2} maxLength={120} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input id="customerEmail" name="customerEmail" type="email" required placeholder="customer@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input id="customerPhone" name="customerPhone" type="tel" required placeholder="+971501234567" />
                <p className="text-xs text-stone-500">Use international format, for example +971501234567.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Input id="productType" name="productType" required minLength={2} maxLength={80} placeholder="e.g. Motorized Blinds" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Installation Address</Label>
              <Input id="address" name="address" required minLength={5} maxLength={250} placeholder="Full address or area" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" required min={1} defaultValue={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Requested Date</Label>
                <Input id="scheduledDate" name="scheduledDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Requested Time</Label>
                <Input id="scheduledTime" name="scheduledTime" type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" maxLength={1000} placeholder="Optional customer or installation notes" />
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
