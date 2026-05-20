"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createJob, getJobErrorMessage, type JobPriority } from "@/lib/jobs";

const AddressPickerMap = dynamic(() => import("@/components/common/AddressPickerMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-xl bg-slate-100 animate-pulse mt-2 flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest font-bold">Loading Map...</div>,
});

// Removed buildScheduledAt, handled inline

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomCountryCode, setIsCustomCountryCode] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [addressValue, setAddressValue] = useState("");
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);

  const handleAddressSelect = (address: string) => {
    setAddressValue(address);
    if (addressInputRef.current) {
      addressInputRef.current.value = address;
    }
  };

  // Synchronize typed address to the map using forward geocoding
  useEffect(() => {
    if (!addressValue || addressValue.length < 5) return;

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&limit=1&countrycodes=ae`);
        const data = await res.json();
        if (data && data.length > 0) {
          setMapCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }, 1200); // 1.2s debounce
    return () => clearTimeout(timeout);
  }, [addressValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const projectValueRaw = formData.get("projectValue");
    const projectValue = projectValueRaw ? Number(projectValueRaw) : undefined;

    const countryCode = String(formData.get("countryCode") || "+971").trim();
    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    const customerPhone = phoneNumber ? `${countryCode} ${phoneNumber}`.trim() : "";

    const dateValue = String(formData.get("scheduledDate") || "").trim();
    const timeValue = String(formData.get("scheduledTime") || "").trim();

    let scheduledAt: string | undefined = undefined;
    let appendedNotes = "";

    if (dateValue && timeValue) {
      scheduledAt = new Date(`${dateValue}T${timeValue}:00`).toISOString();
    } else if (dateValue && !timeValue) {
      scheduledAt = new Date(`${dateValue}T00:00:00`).toISOString();
      appendedNotes = "REQ_DATE_ONLY";
    } else if (!dateValue && timeValue) {
      appendedNotes = `REQ_TIME_ONLY:${timeValue}`;
    }

    try {
      await createJob({
        customerName: String(formData.get("customerName") || "").trim(),
        customerPhone: customerPhone,
        address: String(formData.get("address") || "").trim(),
        propertyType: String(formData.get("propertyType") || "").trim() || undefined,
        projectValue: Number.isFinite(projectValue) ? projectValue : undefined,
        priority: String(formData.get("priority") || "medium") as JobPriority,
        status: "pending",
        scheduledAt,
        notes: appendedNotes || undefined,
      });

      toast.success("Job created and saved successfully.");
      router.push("/sales-manager/salesman-assignments");
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
        <Link href="/sales-manager/salesman-assignments" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
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
            {/* <div className="space-y-2">
              <Label htmlFor="customerName">Client Name</Label>
              <Input id="customerName" name="customerName" required minLength={2} maxLength={120} placeholder="e.g. John Doe" />
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="customerName">Client Name</Label>

              <Input
                id="customerName"
                name="customerName"
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. John Doe"
                onChange={(e) => {
                  const value = e.target.value;

                  e.target.value =
                    value.charAt(0).toUpperCase() + value.slice(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">WhatsApp Number</Label>
              <div className="flex gap-2 items-center">
                {!isCustomCountryCode ? (
                  <Select 
                    name="countryCode" 
                    defaultValue="+971"
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setIsCustomCountryCode(true);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="+971">🇦🇪 +971</SelectItem>
                      <SelectItem value="+966">🇸🇦 +966</SelectItem>
                      <SelectItem value="+974">🇶🇦 +974</SelectItem>
                      <SelectItem value="+973">🇧🇭 +973</SelectItem>
                      <SelectItem value="+965">🇰🇼 +965</SelectItem>
                      <SelectItem value="+968">🇴🇲 +968</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+92">🇵🇰 +92</SelectItem>
                      <SelectItem value="+63">🇵🇭 +63</SelectItem>
                      <SelectItem value="custom">✏️ Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-1 items-center">
                    <Input 
                      name="countryCode" 
                      defaultValue="+"
                      placeholder="+971" 
                      className="w-[80px]" 
                      autoFocus
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsCustomCountryCode(false)}
                      className="px-2 h-10 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Reset
                    </Button>
                  </div>
                )}
                <Input id="phoneNumber" name="phoneNumber" type="tel" required placeholder="50 123 4567" className="flex-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address">Area / Location</Label>
                <div className="relative">
                  <Input
                    ref={addressInputRef}
                    id="address"
                    name="address"
                    required
                    minLength={5}
                    maxLength={250}
                    placeholder="Search Area or click on the map below..."
                    value={addressValue}
                    onChange={(e) => setAddressValue(e.target.value)}
                  />
                  <AddressPickerMap onAddressSelect={handleAddressSelect} externalCoords={mapCoords} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
