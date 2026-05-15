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
    const projectValueRaw = formData.get("projectValue");
    const projectValue = projectValueRaw ? Number(projectValueRaw) : undefined;

    try {
      await createJob({
        customerName: String(formData.get("customerName") || "").trim(),
        customerPhone: String(formData.get("customerPhone") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        propertyType: String(formData.get("propertyType") || "").trim() || undefined,
        projectValue: Number.isFinite(projectValue) ? projectValue : undefined,
        priority: String(formData.get("priority") || "medium") as JobPriority,
        status: "pending",
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
          <p className="text-stone-500 dark:text-neutral-400">Manually add a new installation job</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customerName">Client Name</Label>
              <Input id="customerName" name="customerName" required minLength={2} maxLength={120} placeholder="e.g. John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">WhatsApp Number</Label>
              <Input id="customerPhone" name="customerPhone" type="tel" required placeholder="+971 50 123 4567" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Area / Location</Label>
                <Input id="address" name="address" required minLength={5} maxLength={250} placeholder="e.g. Downtown Dubai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectValue">Project Value (AED)</Label>
                <Input id="projectValue" name="projectValue" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select name="propertyType">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="" required>
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

            <div className="pt-4 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-black text-white hover:bg-stone-800">
                {isLoading ? "Saving..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
