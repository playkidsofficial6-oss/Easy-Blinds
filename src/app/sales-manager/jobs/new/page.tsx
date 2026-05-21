"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, ChevronsUpDown, Mail, MapPin, Phone, User, Calendar, Clock, DollarSign, Building, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createJob, getJobErrorMessage, type JobPriority } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const AddressPickerMap = dynamic(() => import("@/components/common/AddressPickerMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-xl bg-slate-100 animate-pulse mt-2 flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest font-bold">Loading Map...</div>,
});

const COUNTRIES = [
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [addressValue, setAddressValue] = useState("");
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);

  const [openCountry, setOpenCountry] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleAddressSelect = (address: string) => {
    setAddressValue(address);
    if (addressInputRef.current) {
      addressInputRef.current.value = address;
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Fetch suggestions as user types (debounced)
  useEffect(() => {
    if (!addressValue || addressValue.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&limit=5&countrycodes=ae,in`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [addressValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const newErrors: Record<string, string> = {};

    const firstName = String(formData.get("firstName") || "").trim();
    if (!firstName || firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters.";
    }

    const lastName = String(formData.get("lastName") || "").trim();
    if (!lastName || lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters.";
    }

    const customerEmail = String(formData.get("customerEmail") || "").trim() || undefined;
    if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address.";
    }

    const phoneNumber = String(formData.get("phoneNumber") || "").trim();
    if (!phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    }

    const address = String(formData.get("address") || "").trim();
    if (!address || address.length < 5) {
      newErrors.address = "Address is required and must be at least 5 characters.";
    }

    const projectValueRaw = formData.get("projectValue");
    const projectValue = projectValueRaw ? Number(projectValueRaw) : undefined;
    if (projectValue !== undefined && projectValue < 0) {
      newErrors.projectValue = "Project value must be a positive number.";
    }

    const dateValue = String(formData.get("scheduledDate") || "").trim();
    const timeValue = String(formData.get("scheduledTime") || "").trim();

    if (dateValue) {
      const selectedDate = new Date(dateValue);
      const today = new Date();
      // Reset time for both dates to midnight for a fair date comparison
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.scheduledDate = "Scheduled date cannot be in the past.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const countryCode = isCustom ? customCountryCode : selectedCountry.code;
    const customerPhone = phoneNumber ? `${countryCode} ${phoneNumber}`.trim() : "";

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
        firstName,
        lastName,
        customerEmail,
        customerPhone,
        address,
        propertyType: String(formData.get("propertyType") || "").trim() || undefined,
        projectValue: Number.isFinite(projectValue) ? projectValue : undefined,
        priority: String(formData.get("priority") || "medium") as JobPriority,
        status: "pending",
        scheduledAt,
        notes: appendedNotes || undefined,
      });

      toast.success("Job created successfully.");
      router.push("/sales-manager/salesman-assignments");
      router.refresh();
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to create job."));
    } finally {
      setIsLoading(false);
    }
  };

  const capitalize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 0) {
      e.target.value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    // Clear error for the field if typing
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/sales-manager/salesman-assignments" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Create New Job</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fill out the form below to manually schedule an installation job.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Client Information Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <User className="w-5 h-5 text-blue-500" />
              Client Information
            </h2>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-600 dark:text-slate-300">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="firstName"
                name="firstName"
                required
                placeholder="e.g. John"
                onChange={capitalize}
                className={cn("bg-white dark:bg-slate-900", errors.firstName && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-600 dark:text-slate-300">Last Name <span className="text-red-500">*</span></Label>
              <Input
                id="lastName"
                name="lastName"
                required
                placeholder="e.g. Doe"
                onChange={capitalize}
                className={cn("bg-white dark:bg-slate-900", errors.lastName && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="text-slate-600 dark:text-slate-300">Email Address <span className="text-slate-400 font-normal text-xs">(Optional)</span></Label>
              <div className="relative">
                <Mail className={cn("w-4 h-4 absolute left-3 top-3 text-slate-400", errors.customerEmail && "text-red-500")} />
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  placeholder="e.g. john@example.com"
                  onChange={handleInputChange}
                  className={cn("pl-9 bg-white dark:bg-slate-900", errors.customerEmail && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              {errors.customerEmail && <p className="text-sm text-red-500 mt-1">{errors.customerEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-slate-600 dark:text-slate-300">WhatsApp Number <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 relative">
                {!isCustom ? (
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCountry}
                        className="w-[140px] justify-between bg-white dark:bg-slate-900 px-3 font-normal"
                      >
                        <span className="truncate flex items-center gap-2">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          {selectedCountry.code}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES.map((country) => (
                              <CommandItem
                                key={country.name}
                                value={`${country.name} ${country.code}`}
                                onSelect={() => {
                                  setSelectedCountry(country);
                                  setOpenCountry(false);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCountry.name === country.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-lg">{country.flag}</span>
                                <span className="flex-1">{country.name}</span>
                                <span className="text-slate-500">{country.code}</span>
                              </CommandItem>
                            ))}
                            <CommandItem
                              value="custom"
                              onSelect={() => {
                                setIsCustom(true);
                                setOpenCountry(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className="mr-2 h-4 w-4 opacity-0" />
                              <span className="flex-1">✏️ Custom Code...</span>
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="flex gap-1 items-center w-[140px]">
                    <Input 
                      name="customCountryCode" 
                      value={customCountryCode}
                      onChange={(e) => setCustomCountryCode(e.target.value)}
                      placeholder="+971" 
                      className="w-full bg-white dark:bg-slate-900" 
                      autoFocus
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsCustom(false)}
                      className="h-10 w-10 shrink-0 text-slate-400 hover:text-slate-600"
                      title="Reset"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="relative flex-1">
                  <Phone className={cn("w-4 h-4 absolute left-3 top-3 text-slate-400", errors.phoneNumber && "text-red-500")} />
                  <Input 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    type="tel" 
                    required 
                    placeholder="50 123 4567" 
                    onChange={handleInputChange}
                    className={cn("pl-9 bg-white dark:bg-slate-900", errors.phoneNumber && "border-red-500 focus-visible:ring-red-500")} 
                  />
                </div>
              </div>
              {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
            </div>
          </CardContent>

          {/* Location Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-y border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <MapPin className="w-5 h-5 text-emerald-500" />
              Location Details
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-600 dark:text-slate-300">Area / Location Address <span className="text-red-500">*</span></Label>
              <div ref={suggestionsRef} className="relative">
                <Input
                  ref={addressInputRef}
                  id="address"
                  name="address"
                  required
                  placeholder="Search Area or click on the map below..."
                  value={addressValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const capitalized = val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : "";
                    setAddressValue(capitalized);
                    setShowSuggestions(true);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className={cn("bg-white dark:bg-slate-900", errors.address && "border-red-500 focus-visible:ring-red-500")}
                />
                
                {showSuggestions && (addressValue.length >= 3) && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingSuggestions && (
                      <div className="p-3 text-xs text-slate-400 dark:text-slate-500 italic">
                        Searching places...
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.length === 0 && (
                      <div className="p-3 text-xs text-slate-400 dark:text-slate-500">
                        No matches found.
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAddressValue(item.display_name);
                          setMapCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                          setShowSuggestions(false);
                          if (addressInputRef.current) {
                            addressInputRef.current.value = item.display_name;
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 transition-colors text-xs text-slate-700 dark:text-slate-300"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
                <div className="mt-4 border rounded-xl overflow-hidden shadow-inner">
                  <AddressPickerMap onAddressSelect={handleAddressSelect} externalCoords={mapCoords} />
                </div>
              </div>
            </div>
          </CardContent>

          {/* Project Details */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-y border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Building className="w-5 h-5 text-indigo-500" />
              Project Specifics
            </h2>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="propertyType" className="text-slate-600 dark:text-slate-300">Property Type</Label>
              <Select name="propertyType">
                <SelectTrigger className="bg-white dark:bg-slate-900">
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
              <Label htmlFor="projectValue" className="text-slate-600 dark:text-slate-300">Project Value (AED)</Label>
              <div className="relative">
                <DollarSign className={cn("w-4 h-4 absolute left-3 top-3 text-slate-400", errors.projectValue && "text-red-500")} />
                <Input 
                  id="projectValue" 
                  name="projectValue" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  onChange={handleInputChange}
                  className={cn("pl-9 bg-white dark:bg-slate-900", errors.projectValue && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              {errors.projectValue && <p className="text-sm text-red-500 mt-1">{errors.projectValue}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-600 dark:text-slate-300">Priority <span className="text-red-500">*</span></Label>
              <Select name="priority" defaultValue="medium" required>
                <SelectTrigger className="bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          {/* Scheduling */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-y border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Calendar className="w-5 h-5 text-amber-500" />
              Scheduling Preference
            </h2>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="text-slate-600 dark:text-slate-300">Requested Date</Label>
              <div className="relative">
                <Calendar className={cn("w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none", errors.scheduledDate && "text-red-500")} />
                <Input 
                  id="scheduledDate" 
                  name="scheduledDate" 
                  type="date" 
                  min={todayStr}
                  onChange={handleInputChange}
                  className={cn("pl-9 bg-white dark:bg-slate-900", errors.scheduledDate && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              {errors.scheduledDate && <p className="text-sm text-red-500 mt-1">{errors.scheduledDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime" className="text-slate-600 dark:text-slate-300">Requested Time</Label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <Input 
                  id="scheduledTime" 
                  name="scheduledTime" 
                  type="time" 
                  className="pl-9 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[120px]"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? "Saving Details..." : "Create New Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
