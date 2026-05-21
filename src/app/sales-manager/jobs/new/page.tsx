"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, ChevronsUpDown, Mail, MapPin, Phone, User, Calendar, Clock, Building } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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


type NominatimAddress = Record<string, string | undefined>;

type NominatimPlace = {
  place_id?: number;
  osm_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: NominatimAddress;
  namedetails?: Record<string, string | undefined>;
};

type AddressSuggestion = {
  id: string;
  display_name: string;
  lat: string;
  lon: string;
  primary: string;
  secondary: string;
  category: string;
  regionScore: number;
  matchScore: number;
  importance: number;
  source: "curated" | "nominatim";
};

const KERALA_VIEWBOX = "74.8,12.9,77.5,8.0";
const UAE_VIEWBOX = "51.4,26.5,56.6,22.4";

const ADDRESS_QUERY_ALIASES: Record<string, string> = {
  jbr: "Jumeirah Beach Residence Dubai",
  manjri: "Manjeri Kerala",
  nilamb: "Nilambur Kerala",
  marina: "Dubai Marina",
  barsha: "Al Barsha Dubai",
  lulu: "Lulu Mall Kerala UAE",
  sobha: "Sobha Hartland Dubai",
  aster: "Aster Clinic Dubai Kerala",
};

const CURATED_ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { id: "curated-dubai-marina", display_name: "Dubai Marina, Dubai, United Arab Emirates", lat: "25.0800", lon: "55.1400", primary: "Dubai Marina", secondary: "Dubai, UAE", category: "Area", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-jbr", display_name: "Jumeirah Beach Residence (JBR), Dubai, United Arab Emirates", lat: "25.0781", lon: "55.1335", primary: "Jumeirah Beach Residence (JBR)", secondary: "Dubai, UAE", category: "Community", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-business-bay", display_name: "Business Bay, Dubai, United Arab Emirates", lat: "25.1840", lon: "55.2640", primary: "Business Bay", secondary: "Dubai, UAE", category: "Area", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-burj-khalifa", display_name: "Burj Khalifa, Downtown Dubai, United Arab Emirates", lat: "25.1972", lon: "55.2744", primary: "Burj Khalifa", secondary: "Downtown Dubai, UAE", category: "Landmark", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-al-barsha", display_name: "Al Barsha, Dubai, United Arab Emirates", lat: "25.1107", lon: "55.2000", primary: "Al Barsha", secondary: "Dubai, UAE", category: "Area", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-jumeirah", display_name: "Jumeirah, Dubai, United Arab Emirates", lat: "25.2048", lon: "55.2532", primary: "Jumeirah", secondary: "Dubai, UAE", category: "Area", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-sobha", display_name: "Sobha Hartland, Mohammed Bin Rashid City, Dubai, United Arab Emirates", lat: "25.1764", lon: "55.3098", primary: "Sobha Hartland", secondary: "Dubai, UAE", category: "Community", regionScore: 160, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-sharjah", display_name: "Sharjah, United Arab Emirates", lat: "25.3463", lon: "55.4209", primary: "Sharjah", secondary: "UAE", category: "City", regionScore: 145, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-abu-dhabi", display_name: "Abu Dhabi, United Arab Emirates", lat: "24.4539", lon: "54.3773", primary: "Abu Dhabi", secondary: "UAE", category: "City", regionScore: 140, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-nilambur", display_name: "Nilambur, Malappuram, Kerala, India", lat: "11.2794", lon: "76.2389", primary: "Nilambur", secondary: "Malappuram, Kerala", category: "Town", regionScore: 155, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-manjeri", display_name: "Manjeri, Malappuram, Kerala, India", lat: "11.1202", lon: "76.1197", primary: "Manjeri", secondary: "Malappuram, Kerala", category: "Town", regionScore: 155, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-edakkara", display_name: "Edakkara, Malappuram, Kerala, India", lat: "11.3577", lon: "76.3076", primary: "Edakkara", secondary: "Malappuram, Kerala", category: "Town", regionScore: 155, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-mg-road-kochi", display_name: "Mahatma Gandhi Road (MG Road), Kochi, Kerala, India", lat: "9.9698", lon: "76.2867", primary: "MG Road", secondary: "Kochi, Kerala", category: "Street", regionScore: 150, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-lulu-kochi", display_name: "Lulu Mall, Edappally, Kochi, Kerala, India", lat: "10.0276", lon: "76.3071", primary: "Lulu Mall", secondary: "Edappally, Kochi, Kerala", category: "Landmark", regionScore: 150, matchScore: 0, importance: 1, source: "curated" },
];

const normalizeAddressText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const stripUnitFragments = (value: string) => value.replace(/\b(flat|apt|apartment|villa|house|room|unit|door|no)\s*\w*/gi, " ").replace(/\s+/g, " ").trim();

const getNominatimSearchQuery = (query: string) => {
  const normalized = normalizeAddressText(query);
  return ADDRESS_QUERY_ALIASES[normalized] || stripUnitFragments(query) || query;
};

const getAddressPrimary = (place: NominatimPlace) => {
  const address = place.address || {};
  return (
    place.namedetails?.name ||
    address.building ||
    address.house_name ||
    address.amenity ||
    address.shop ||
    address.tourism ||
    address.road ||
    address.neighbourhood ||
    address.suburb ||
    address.city ||
    address.town ||
    address.village ||
    place.display_name.split(",")[0]
  );
};

const getAddressSecondary = (place: NominatimPlace) => {
  const address = place.address || {};
  const parts = [
    address.neighbourhood || address.suburb || address.city_district,
    address.city || address.town || address.village || address.county,
    address.state,
    address.country_code === "ae" ? "UAE" : address.country,
  ].filter(Boolean);
  return Array.from(new Set(parts)).slice(0, 3).join(", ");
};

const getAddressCategory = (place: NominatimPlace) => {
  const address = place.address || {};
  const value = `${place.class || ""} ${place.type || ""}`.toLowerCase();
  if (address.building || address.house_name || value.includes("building") || value.includes("apartments")) return "Building";
  if (address.road || value.includes("street") || value.includes("residential")) return "Street";
  if (address.shop) return "Shop";
  if (address.amenity || address.tourism || value.includes("attraction")) return "Landmark";
  if (address.neighbourhood || address.suburb || value.includes("neighbourhood")) return "Area";
  if (address.city || address.town || address.village) return "Locality";
  return "Place";
};

const getRegionScore = (place: Pick<AddressSuggestion, "display_name" | "lat" | "lon">, address?: NominatimAddress) => {
  const name = normalizeAddressText(place.display_name);
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  const isUae = name.includes("united arab emirates") || name.includes(" uae") || address?.country_code === "ae";
  const isKerala = name.includes("kerala") || address?.state?.toLowerCase() === "kerala";
  const inUaeBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 22.4 && lat <= 26.5 && lon >= 51.4 && lon <= 56.6;
  const inKeralaBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 8.0 && lat <= 12.9 && lon >= 74.8 && lon <= 77.5;
  const isPriorityUaeCity = ["dubai", "sharjah", "abu dhabi"].some((city) => name.includes(city));
  if (isPriorityUaeCity) return 160;
  if (isKerala) return 155;
  if (isUae || inUaeBounds) return 145;
  if (inKeralaBounds) return 140;
  if (name.includes("india") || address?.country_code === "in") return 40;
  return -80;
};

const getMatchScore = (suggestion: Pick<AddressSuggestion, "primary" | "display_name" | "category">, query: string) => {
  const normalizedQuery = normalizeAddressText(query);
  const normalizedPrimary = normalizeAddressText(suggestion.primary);
  const normalizedDisplay = normalizeAddressText(suggestion.display_name);
  if (!normalizedQuery) return 0;
  let score = 0;
  if (normalizedPrimary === normalizedQuery) score += 120;
  if (normalizedPrimary.startsWith(normalizedQuery)) score += 85;
  if (normalizedDisplay.includes(normalizedQuery)) score += 55;
  if (["building", "landmark", "street", "community", "area", "shop"].includes(suggestion.category.toLowerCase())) score += 16;
  return score;
};

const toAddressSuggestion = (place: NominatimPlace, query: string): AddressSuggestion => {
  const primary = getAddressPrimary(place);
  const secondary = getAddressSecondary(place);
  const category = getAddressCategory(place);
  const base = {
    id: String(place.place_id || place.osm_id || `${place.lat}-${place.lon}-${place.display_name}`),
    display_name: place.display_name,
    lat: place.lat,
    lon: place.lon,
    primary,
    secondary,
    category,
    regionScore: getRegionScore(place, place.address),
    matchScore: 0,
    importance: Number(place.importance || 0),
    source: "nominatim" as const,
  };
  return { ...base, matchScore: getMatchScore(base, query) };
};

const getCuratedMatches = (query: string) => {
  const normalizedQuery = normalizeAddressText(query);
  const expandedQuery = normalizeAddressText(ADDRESS_QUERY_ALIASES[normalizedQuery] || query);
  if (!normalizedQuery) return [];
  return CURATED_ADDRESS_SUGGESTIONS
    .filter((item) => {
      const haystack = normalizeAddressText(`${item.primary} ${item.display_name}`);
      const primary = normalizeAddressText(item.primary);
      return haystack.includes(normalizedQuery) || haystack.includes(expandedQuery) || expandedQuery.includes(primary) || primary.startsWith(normalizedQuery);
    })
    .map((item) => ({ ...item, matchScore: getMatchScore(item, query) + 30 }));
};

const rankAndDedupeSuggestions = (items: AddressSuggestion[]) => {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = `${normalizeAddressText(item.primary)}-${Number(item.lat).toFixed(4)}-${Number(item.lon).toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return item.regionScore >= 140 || item.matchScore >= 130;
    })
    .sort((a, b) => (b.regionScore + b.matchScore + b.importance * 20) - (a.regionScore + a.matchScore + a.importance * 20))
    .slice(0, 8);
};

const highlightSuggestionMatch = (text: string, query: string) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return text;
  const index = text.toLowerCase().indexOf(normalizedQuery.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-100 px-0.5 font-semibold text-slate-950 dark:bg-yellow-400/25 dark:text-yellow-100">{text.slice(index, index + normalizedQuery.length)}</mark>
      {text.slice(index + normalizedQuery.length)}
    </>
  );
};

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

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());
  const suggestionAbortRef = useRef<AbortController | null>(null);

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

  // Fetch professional address suggestions as user types with regional bias, debouncing, cancellation, and cache reuse.
  useEffect(() => {
    const rawQuery = addressValue.trim();
    const normalizedQuery = normalizeAddressText(rawQuery);

    if (!rawQuery || rawQuery.length < 2) {
      suggestionAbortRef.current?.abort();
      const resetTimer = window.setTimeout(() => {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const cachedSuggestions = suggestionCacheRef.current.get(normalizedQuery);
    if (cachedSuggestions) {
      const cacheTimer = window.setTimeout(() => {
        setSuggestions(cachedSuggestions);
        setIsLoadingSuggestions(false);
      }, 0);
      return () => clearTimeout(cacheTimer);
    }

    const delayDebounce = setTimeout(async () => {
      suggestionAbortRef.current?.abort();
      const controller = new AbortController();
      suggestionAbortRef.current = controller;
      setIsLoadingSuggestions(true);

      try {
        const searchQuery = getNominatimSearchQuery(rawQuery);
        const baseParams = new URLSearchParams({
          format: "jsonv2",
          q: searchQuery,
          limit: "10",
          countrycodes: "ae,in",
          addressdetails: "1",
          namedetails: "1",
          extratags: "1",
          dedupe: "1",
          polygon_geojson: "0",
        });

        const requests = [
          new URLSearchParams({ ...Object.fromEntries(baseParams), viewbox: UAE_VIEWBOX, bounded: "1" }),
          new URLSearchParams({ ...Object.fromEntries(baseParams), viewbox: KERALA_VIEWBOX, bounded: "1" }),
          baseParams,
        ].map((params) => fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal: controller.signal }));

        const responses = await Promise.allSettled(requests);
        const apiResults = await Promise.all(
          responses
            .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled" && result.value.ok)
            .map((result) => result.value.json() as Promise<NominatimPlace[]>),
        );

        const rankedSuggestions = rankAndDedupeSuggestions([
          ...getCuratedMatches(rawQuery),
          ...apiResults.flat().map((place) => toAddressSuggestion(place, rawQuery)),
        ]);

        suggestionCacheRef.current.set(normalizedQuery, rankedSuggestions);
        setSuggestions(rankedSuggestions);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Failed to fetch suggestions", err);
        setSuggestions(rankAndDedupeSuggestions(getCuratedMatches(rawQuery)));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(delayDebounce);
      suggestionAbortRef.current?.abort();
    };
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
                            {/* <CommandItem
                              value="custom"
                              onSelect={() => {
                                setIsCustom(true);
                                setOpenCountry(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className="mr-2 h-4 w-4 opacity-0" />
                              <span className="flex-1">✏️ Custom Code...</span>
                            </CommandItem> */}
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
                
                {showSuggestions && (addressValue.trim().length >= 2) && (
                  <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 ring-1 ring-slate-900/5 transition-all dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30">
                    <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                      Kerala and UAE location search
                    </div>
                    {isLoadingSuggestions && (
                      <div className="space-y-2 p-3">
                        {[0, 1, 2].map((item) => (
                          <div key={item} className="flex animate-pulse items-center gap-3 rounded-xl p-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                              <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.length === 0 && (
                      <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                        No strong Kerala or UAE matches found. Try an area, building, street, landmark, or community name.
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setAddressValue(item.display_name);
                          setMapCoords([parseFloat(item.lat), parseFloat(item.lon)]);
                          setShowSuggestions(false);
                          if (addressInputRef.current) {
                            addressInputRef.current.value = item.display_name;
                          }
                        }}
                        className="group flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-all last:border-b-0 hover:bg-emerald-50/70 focus:bg-emerald-50 focus:outline-none dark:border-slate-800 dark:hover:bg-emerald-950/20 dark:focus:bg-emerald-950/20"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{highlightSuggestionMatch(item.primary, addressValue)}</span>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.category}</span>
                          </span>
                          <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.secondary || item.display_name}
                          </span>
                        </span>
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
                <span className={cn("absolute left-3 top-2.5 text-[11px] font-bold text-slate-400 select-none", errors.projectValue && "text-red-500")}>AED</span>
                <Input 
                  id="projectValue" 
                  name="projectValue" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  onChange={handleInputChange}
                  className={cn("pl-12 bg-white dark:bg-slate-900", errors.projectValue && "border-red-500 focus-visible:ring-red-500")}
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
