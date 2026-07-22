"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CalendarDays, Pencil, X, MapPin, Clock, Car, CalendarCheck, Target, Ruler, BarChart3, TrendingUp, CheckCircle2, AlertCircle, Search, Timer } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { JobCard, type UnifiedJob } from "@/components/common/JobCard";
import { useAuth } from "@/components/providers/auth-provider";
import { FilterSortBar } from "@/components/common/FilterSortBar";
import { cn } from "@/lib/utils";
import { getJobErrorMessage, getJobs, updateJob, deleteJob, type Job } from "@/lib/jobs";
import { useLiveFitters, isAssignedToFitter, type Fitter, type FitterJob, type FitterStatus } from "@/lib/live-store";
import { getUserErrorMessage, getUsers, type UserRecord, extractLatLng } from "@/lib/users";
import { useLiveLocation } from "@/hooks";
import { getLiveLocationSocket } from "@/services/socket";

const AssignmentMap = dynamic(() => import("@/components/tracking/SalesmanMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-[0.2em]">LOADING DATA...</div>,
});

const AddressPickerMap = dynamic(() => import("@/components/common/AddressPickerMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-xl bg-slate-100 animate-pulse mt-2 flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest font-bold">Loading Map...</div>,
});

const DAILY_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];
type DispatchSortKey = "Default Sorting" | "nearest" | "highest_value" | "newest" | "urgent_first" | "oldest_pending";

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(start: [number, number], end: [number, number]): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end[0] - start[0]);
  const dLng = toRadians(end[1] - start[1]);
  const lat1 = toRadians(start[0]);
  const lat2 = toRadians(end[0]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEtaMinutes(distance: number): number {
  return Math.max(1, Math.round((distance / 32) * 60));
}

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
const MALAPPURAM_VIEWBOX = "75.75,11.62,76.58,10.68";
const DUBAI_VIEWBOX = "54.88,25.36,55.58,24.78";

const MALAPPURAM_LOCAL_TERMS = [
  "malappuram", "manjeri", "nilambur", "tirur", "perinthalmanna", "kottakkal", "kondotty", "ponnani", "tanur", "vengara", "edappal", "valanchery", "areekode", "chemmad", "parappanangadi", "edakkara", "edavanna", "karuvarakundu", "changaramkulam", "ramanattukara", "calicut airport", "karipur", "down hill", "up hill",
];

const DUBAI_LOCAL_TERMS = [
  "dubai", "deira", "bur dubai", "karama", "satwa", "al quoz", "al nahda", "al rigga", "jbr", "marina", "jlt", "jvc", "business bay", "downtown", "mirdif", "international city", "silicon oasis", "dso", "barsha", "tecom", "barsha heights", "discovery gardens", "dubai hills", "palm jumeirah", "meydan", "difc", "nad al sheba", "al warqa", "arabian ranches", "damac hills",
];

const ADDRESS_QUERY_ALIASES: Record<string, string> = {
  jbr: "Jumeirah Beach Residence Dubai",
  jlt: "Jumeirah Lakes Towers Dubai",
  jvc: "Jumeirah Village Circle Dubai",
  dso: "Dubai Silicon Oasis Dubai",
  tecom: "Barsha Heights Tecom Dubai",
  marina: "Dubai Marina",
  barsha: "Al Barsha Dubai",
  karama: "Al Karama Dubai",
  satwa: "Al Satwa Dubai",
  rigga: "Al Rigga Deira Dubai",
  quoz: "Al Quoz Dubai",
  nahda: "Al Nahda Dubai",
  mirdif: "Mirdif Dubai",
  difc: "Dubai International Financial Centre",
  lulu: "Lulu Mall Malappuram Dubai",
  sobha: "Sobha Hartland Dubai",
  aster: "Aster Clinic Dubai Malappuram",
  manjri: "Manjeri Malappuram Kerala",
  manjeri: "Manjeri Malappuram Kerala",
  nilamb: "Nilambur Malappuram Kerala",
  nilambur: "Nilambur Malappuram Kerala",
  mlp: "Malappuram Kerala",
  tirur: "Tirur Malappuram Kerala",
  kottakkal: "Kottakkal Malappuram Kerala",
  perinthalmanna: "Perinthalmanna Malappuram Kerala",
  kondotty: "Kondotty Malappuram Kerala",
  karipur: "Calicut International Airport Karipur Malappuram Kerala",
  edappal: "Edappal Malappuram Kerala",
  ponnani: "Ponnani Malappuram Kerala",
  valanchery: "Valanchery Malappuram Kerala",
  areekode: "Areekode Malappuram Kerala",
  chemmad: "Chemmad Tirurangadi Malappuram Kerala",
  vengara: "Vengara Malappuram Kerala",
  tanur: "Tanur Malappuram Kerala",
  downhill: "Down Hill Malappuram Kerala",
  "down hill": "Down Hill Malappuram Kerala",
  uphill: "Up Hill Malappuram Kerala",
  "up hill": "Up Hill Malappuram Kerala",
  "calicut airport": "Calicut International Airport Karipur Malappuram Kerala",
  calicutairport: "Calicut International Airport Karipur Malappuram Kerala",
};

const CURATED_ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { id: "curated-malappuram-town", display_name: "Malappuram Town, Malappuram, Kerala, India", lat: "11.0510", lon: "76.0711", primary: "Malappuram Town", secondary: "Kottappadi / Civil Station area, Malappuram", category: "Town Centre", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-down-hill", display_name: "Down Hill, Malappuram, Kerala, India", lat: "11.0448", lon: "76.0708", primary: "Down Hill", secondary: "Malappuram local area", category: "Area", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-up-hill", display_name: "Up Hill, Malappuram, Kerala, India", lat: "11.0581", lon: "76.0740", primary: "Up Hill", secondary: "Malappuram local area", category: "Area", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-manjeri", display_name: "Manjeri, Malappuram, Kerala, India", lat: "11.1202", lon: "76.1197", primary: "Manjeri", secondary: "Town / hospital and retail hub, Malappuram", category: "Town", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-nilambur", display_name: "Nilambur, Malappuram, Kerala, India", lat: "11.2794", lon: "76.2389", primary: "Nilambur", secondary: "Eastern Malappuram / Gudalur route", category: "Town", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-tirur", display_name: "Tirur, Malappuram, Kerala, India", lat: "10.9146", lon: "75.9221", primary: "Tirur", secondary: "Railway and coastal-side town, Malappuram", category: "Town", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-perinthalmanna", display_name: "Perinthalmanna, Malappuram, Kerala, India", lat: "10.9765", lon: "76.2260", primary: "Perinthalmanna", secondary: "Hospital and residential hub, Malappuram", category: "Town", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-kottakkal", display_name: "Kottakkal, Malappuram, Kerala, India", lat: "10.9996", lon: "76.0058", primary: "Kottakkal", secondary: "Ayurveda / NH 66 side, Malappuram", category: "Town", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-kondotty", display_name: "Kondotty, Malappuram, Kerala, India", lat: "11.1444", lon: "75.9656", primary: "Kondotty", secondary: "Karipur airport side, Malappuram", category: "Town", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-karipur-airport", display_name: "Calicut International Airport, Karipur, Malappuram, Kerala, India", lat: "11.1368", lon: "75.9553", primary: "Calicut International Airport", secondary: "Karipur / Kondotty, Malappuram", category: "Landmark", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-edappal", display_name: "Edappal, Malappuram, Kerala, India", lat: "10.7847", lon: "76.0106", primary: "Edappal", secondary: "Ponnani / Kuttippuram side, Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-valanchery", display_name: "Valanchery, Malappuram, Kerala, India", lat: "10.8892", lon: "76.0730", primary: "Valanchery", secondary: "Kuttippuram / Kottakkal route, Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-ponnani", display_name: "Ponnani, Malappuram, Kerala, India", lat: "10.7677", lon: "75.9259", primary: "Ponnani", secondary: "Coastal Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-vengara", display_name: "Vengara, Malappuram, Kerala, India", lat: "11.0516", lon: "75.9894", primary: "Vengara", secondary: "Malappuram local route", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-chemmad", display_name: "Chemmad, Tirurangadi, Malappuram, Kerala, India", lat: "11.0437", lon: "75.9367", primary: "Chemmad", secondary: "Tirurangadi / NH side, Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-areekode", display_name: "Areekode, Malappuram, Kerala, India", lat: "11.2302", lon: "76.0504", primary: "Areekode", secondary: "Mukkam / Manjeri route, Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-edakkara", display_name: "Edakkara, Malappuram, Kerala, India", lat: "11.3577", lon: "76.3076", primary: "Edakkara", secondary: "Nilambur side, Malappuram", category: "Town", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-dubai-marina", display_name: "Dubai Marina, Dubai, United Arab Emirates", lat: "25.0800", lon: "55.1400", primary: "Dubai Marina", secondary: "Marina / JBR / tram-side community, Dubai", category: "Area", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-jbr", display_name: "Jumeirah Beach Residence (JBR), Dubai, United Arab Emirates", lat: "25.0781", lon: "55.1335", primary: "Jumeirah Beach Residence (JBR)", secondary: "The Walk / beach-side towers, Dubai", category: "Community", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-jlt", display_name: "Jumeirah Lakes Towers (JLT), Dubai, United Arab Emirates", lat: "25.0693", lon: "55.1413", primary: "Jumeirah Lakes Towers (JLT)", secondary: "Cluster towers near Dubai Marina", category: "Community", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-jvc", display_name: "Jumeirah Village Circle (JVC), Dubai, United Arab Emirates", lat: "25.0600", lon: "55.2042", primary: "Jumeirah Village Circle (JVC)", secondary: "Villa and apartment community, Dubai", category: "Community", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-business-bay", display_name: "Business Bay, Dubai, United Arab Emirates", lat: "25.1840", lon: "55.2640", primary: "Business Bay", secondary: "Canal-side towers near Downtown Dubai", category: "Area", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-downtown-dubai", display_name: "Downtown Dubai, Dubai, United Arab Emirates", lat: "25.1950", lon: "55.2744", primary: "Downtown Dubai", secondary: "Burj Khalifa / Dubai Mall area", category: "Area", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-burj-khalifa", display_name: "Burj Khalifa, Downtown Dubai, United Arab Emirates", lat: "25.1972", lon: "55.2744", primary: "Burj Khalifa", secondary: "Downtown Dubai landmark", category: "Landmark", regionScore: 190, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-deira", display_name: "Deira, Dubai, United Arab Emirates", lat: "25.2697", lon: "55.3095", primary: "Deira", secondary: "Old Dubai / creek-side market area", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-bur-dubai", display_name: "Bur Dubai, Dubai, United Arab Emirates", lat: "25.2522", lon: "55.2966", primary: "Bur Dubai", secondary: "Old Dubai / Meena Bazaar side", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-karama", display_name: "Al Karama, Dubai, United Arab Emirates", lat: "25.2462", lon: "55.3062", primary: "Al Karama", secondary: "Central Dubai residential and shop area", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-satwa", display_name: "Al Satwa, Dubai, United Arab Emirates", lat: "25.2248", lon: "55.2765", primary: "Al Satwa", secondary: "Jumeirah / Sheikh Zayed Road side", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-al-quoz", display_name: "Al Quoz, Dubai, United Arab Emirates", lat: "25.1412", lon: "55.2265", primary: "Al Quoz", secondary: "Industrial and warehouse district, Dubai", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-al-barsha", display_name: "Al Barsha, Dubai, United Arab Emirates", lat: "25.1107", lon: "55.2000", primary: "Al Barsha", secondary: "Mall of the Emirates side, Dubai", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-barsha-heights", display_name: "Barsha Heights (Tecom), Dubai, United Arab Emirates", lat: "25.0964", lon: "55.1758", primary: "Barsha Heights (Tecom)", secondary: "Hotel and tower district, Dubai", category: "Community", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-dubai-silicon-oasis", display_name: "Dubai Silicon Oasis (DSO), Dubai, United Arab Emirates", lat: "25.1254", lon: "55.3813", primary: "Dubai Silicon Oasis (DSO)", secondary: "Tech and villa community, Dubai", category: "Community", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-international-city", display_name: "International City, Dubai, United Arab Emirates", lat: "25.1662", lon: "55.4087", primary: "International City", secondary: "Cluster-based residential district, Dubai", category: "Community", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-mirdif", display_name: "Mirdif, Dubai, United Arab Emirates", lat: "25.2247", lon: "55.4244", primary: "Mirdif", secondary: "Villa and family residential area, Dubai", category: "Area", regionScore: 188, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-discovery-gardens", display_name: "Discovery Gardens, Dubai, United Arab Emirates", lat: "25.0417", lon: "55.1326", primary: "Discovery Gardens", secondary: "Gardens / Ibn Battuta side, Dubai", category: "Community", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-dubai-hills", display_name: "Dubai Hills Estate, Dubai, United Arab Emirates", lat: "25.1137", lon: "55.2534", primary: "Dubai Hills Estate", secondary: "Villa and apartment community, Dubai", category: "Community", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-sobha", display_name: "Sobha Hartland, Mohammed Bin Rashid City, Dubai, United Arab Emirates", lat: "25.1764", lon: "55.3098", primary: "Sobha Hartland", secondary: "MBR City community, Dubai", category: "Community", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-palm-jumeirah", display_name: "Palm Jumeirah, Dubai, United Arab Emirates", lat: "25.1124", lon: "55.1390", primary: "Palm Jumeirah", secondary: "Trunk, fronds, and crescent, Dubai", category: "Community", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-meydan", display_name: "Meydan, Dubai, United Arab Emirates", lat: "25.1605", lon: "55.3006", primary: "Meydan", secondary: "Nad Al Sheba / MBR City side", category: "Area", regionScore: 186, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-sharjah", display_name: "Sharjah, United Arab Emirates", lat: "25.3463", lon: "55.4209", primary: "Sharjah", secondary: "Nearby UAE emirate", category: "City", regionScore: 135, matchScore: 0, importance: 1, source: "curated" },
  { id: "curated-abu-dhabi", display_name: "Abu Dhabi, United Arab Emirates", lat: "24.4539", lon: "54.3773", primary: "Abu Dhabi", secondary: "UAE capital", category: "City", regionScore: 125, matchScore: 0, importance: 1, source: "curated" },
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
  const inDubaiBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 24.78 && lat <= 25.36 && lon >= 54.88 && lon <= 55.58;
  const inMalappuramBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 10.68 && lat <= 11.62 && lon >= 75.75 && lon <= 76.58;
  const inUaeBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 22.4 && lat <= 26.5 && lon >= 51.4 && lon <= 56.6;
  const inKeralaBounds = Number.isFinite(lat) && Number.isFinite(lon) && lat >= 8.0 && lat <= 12.9 && lon >= 74.8 && lon <= 77.5;
  const isDubaiLocal = DUBAI_LOCAL_TERMS.some((term) => name.includes(term));
  const isMalappuramLocal = MALAPPURAM_LOCAL_TERMS.some((term) => name.includes(term));
  if (isDubaiLocal || isMalappuramLocal || inDubaiBounds || inMalappuramBounds) return 190;
  if (isKerala) return 145;
  if (isUae || inUaeBounds) return 140;
  if (inKeralaBounds) return 132;
  if (name.includes("india") || address?.country_code === "in") return 20;
  return -80;
};

const getMatchScore = (suggestion: Pick<AddressSuggestion, "primary" | "display_name" | "category">, query: string) => {
  const normalizedQuery = normalizeAddressText(query);
  const normalizedPrimary = normalizeAddressText(suggestion.primary);
  const normalizedDisplay = normalizeAddressText(suggestion.display_name);
  const queryTokens = normalizedQuery.split(" ").filter((token) => token.length >= 2);
  if (!normalizedQuery) return 0;
  let score = 0;
  if (normalizedPrimary === normalizedQuery) score += 140;
  if (normalizedPrimary.startsWith(normalizedQuery)) score += 100;
  if (normalizedDisplay.includes(normalizedQuery)) score += 65;
  if (queryTokens.length > 0 && queryTokens.every((token) => normalizedDisplay.includes(token))) score += 45;
  if (MALAPPURAM_LOCAL_TERMS.some((term) => normalizedDisplay.includes(term))) score += 28;
  if (DUBAI_LOCAL_TERMS.some((term) => normalizedDisplay.includes(term))) score += 28;
  if (["building", "landmark", "street", "community", "area", "shop", "town", "town centre"].includes(suggestion.category.toLowerCase())) score += 18;
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

function formatSpeed(speed?: number): string {
  if (typeof speed !== "number" || Number.isNaN(speed)) return "0 km/h";
  const kmh = speed > 45 ? speed : speed * 3.6;
  return `${Math.max(0, kmh).toFixed(0)} km/h`;
}

function toReadableLastUpdated(source?: string) {
  if (!source) return "Not updated";
  try {
    return format(parseISO(source), "MMM d, HH:mm:ss");
  } catch {
    return source;
  }
}

function selectedDateFromSlot(date: Date, slot: string) {
  const [hours, minutes] = slot.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function isJobForDate(job: Job, date: Date) {
  if (!job.scheduledAt) {
    return false;
  }

  try {
    return isSameDay(parseISO(job.scheduledAt), date);
  } catch {
    return false;
  }
}

function toDisplayTime(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return undefined;
  }
}

function getJobDisplayId(job: Job) {
  if (job.jobId) return job.jobId;
  return job._id ? job._id.slice(-6).toUpperCase() : "N/A";
}

// Returns the display name of the assigned fitter.
function resolveAssignedFitterName(job: Job, fitterNameById: Map<string, string>): string {
  const resolveRef = (ref?: any) => {
    if (!ref) return undefined;
    if (typeof ref === "object" && ref !== null && typeof ref.name === "string") {
      return ref.name;
    }
    if (typeof ref === "string") {
      const fromMap = fitterNameById.get(ref);
      if (fromMap) return fromMap;
      if (!ref.match(/^[a-f0-9]{24}$/i)) return ref;
    }
    return undefined;
  };

  const resolved = resolveRef(job.assignedSalesman) || resolveRef(job.assignedTo) || resolveRef(job.assignedFitter);
  if (resolved) return resolved;

  // Oldest legacy: name embedded in notes
  const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
  return match?.[1]?.trim() || "Assigned Team";
}

function getRequestedDateDisplay(job: Job): string | undefined {
  if (job.notes?.includes("REQ_TIME_ONLY:")) {
    const match = job.notes.match(/REQ_TIME_ONLY:(\d{2}:\d{2})/);
    return match ? `Time: ${match[1]}` : undefined;
  }
  if (job.notes?.includes("REQ_DATE_ONLY") && job.scheduledAt) {
    try {
      return format(parseISO(job.scheduledAt), "MMM do");
    } catch {
      return undefined;
    }
  }
  if (job.scheduledAt) {
    try {
      return format(parseISO(job.scheduledAt), "MMM do, HH:mm");
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function getSalesmanWorkflowDisplayStatus(job: Job): FitterJob["status"] {
  if (job.salesmanWorkflowStatus === "travelling") return "On the way";
  if (job.salesmanWorkflowStatus === "measuring") return "In Progress";
  if (job.salesmanWorkflowStatus === "completed") return "Done";
  if (job.status === "in_progress") return "In Progress";
  if (job.status === "completed") return "Done";
  return "Pending";
}

function getSalesmanMapStatus(job?: Job, fallback: FitterStatus = "Available"): FitterStatus {
  if (job?.salesmanWorkflowStatus === "travelling") return "On the way";
  if (job?.salesmanWorkflowStatus === "measuring") return "In progress";
  return fallback;
}

function getInitials(name?: string): string {
  if (!name) return "SM";
  const clean = name.replace(/sales\s*man|sales\s*manager|fitter|representative/gi, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toUnifiedJob(job: Job): UnifiedJob {
  const statusLabel = getSalesmanWorkflowDisplayStatus(job);

  const priorityLabel = job.priority.charAt(0).toUpperCase() + job.priority.slice(1);

  return {
    id: job._id,
    jobId: job.jobId,
    client: job.customerName,
    email: job.customerEmail,
    phone: job.customerPhone,
    brand: "Easy Blinds",
    productType: job.productType,
    priority: priorityLabel,
    property: job.propertyType,
    address: job.address,
    area: job.address,
    status: statusLabel,
    time: toDisplayTime(job.scheduledAt),
    requestedDate: getRequestedDateDisplay(job),
    endTime: undefined,
    team: typeof job.assignedTo === "object" && job.assignedTo !== null ? (job.assignedTo as any).name : job.assignedTo,
    assignedSalesman: job.assignedSalesman,
    assignedTo: job.assignedTo,
    assignedFitter: job.assignedFitter,
    assignedBy: job.assignedBy,
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    createdAt: job.createdAt,
  };
}

function toFitterJob(job: Job): FitterJob {
  return {
    id: job._id,
    jobId: job.jobId,
    client: job.customerName,
    address: job.address,
    time: toDisplayTime(job.scheduledAt) ?? "08:00",
    endTime: "",
    timerStartedAt: job.timerStartedAt,
    status: getSalesmanWorkflowDisplayStatus(job),
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    email: job.customerEmail,
    phone: job.customerPhone,
    notes: job.notes,
    brand: "Easy Blinds",
    property: job.propertyType,
    productType: "Blinds",
    priority: job.priority === "high" ? "High" : job.priority === "medium" ? "Medium" : "Low",
  };
}

function sortUnifiedJobs(jobs: UnifiedJob[], sortKey: DispatchSortKey) {
  const next = [...jobs];

  switch (sortKey) {
    case "highest_value":
      return next.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    case "urgent_first":
      return next.sort((a, b) => Number(b.priority === "High") - Number(a.priority === "High"));
    case "newest":
      return next.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "oldest_pending":
      return next.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    case "nearest":
    case "Default Sorting":
    default:
      return next;
  }
}

function isSalesmanUser(user: UserRecord) {
  const role = user.role?.toLowerCase() ?? "";
  return role === "salesman" || role === "sales_man" || role === "field";
}

function toSalesmanWorkforceMember(user: UserRecord): Fitter {
  return {
    id: user._id,
    name: user.name,
    role: "Salesman",
    jobRef: "--",
    status: user.liveStatus ?? "Available",
    location: (() => { const ll = extractLatLng(user.location); return ll ? [ll.lat, ll.lng] as [number, number] : undefined; })(),
    locationLabel: user.location?.address,
    lastUpdated: (() => { const u = user.location?.updatedAt; if (!u) return "Not updated"; try { return typeof u === "string" ? toReadableLastUpdated(u) : toReadableLastUpdated(new Date(u).toISOString()); } catch { return "Not updated"; } })(),
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    history: [],
    schedule: {
      yesterday: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    },
    capacity: {
      max: user.maxDailyJobs || 5,
      current: 0,
      remaining: user.maxDailyJobs || 5,
    },
    nextAvailableSlot: "Available",
  };
}

function ActiveTimer({ startTime }: { startTime?: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startTime) {
      setElapsed("--:--");
      return;
    }
    const start = new Date(startTime).getTime();
    
    const update = () => {
      const diffMs = Date.now() - start;
      if (diffMs <= 0) {
        setElapsed("0s");
        return;
      }
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      
      if (mins > 0) {
        setElapsed(`${mins}m ${secs}s`);
      } else {
        setElapsed(`${secs}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1 shadow-sm">
      <Timer className="w-3 h-3 text-indigo-500 animate-pulse" />
      {elapsed}
    </span>
  );
}

export default function SmartSalesmanAssignmentsPage() {
  const { user } = useAuth();
  const { fitters: baseFitters, isLoaded } = useLiveFitters();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [salesmanUsers, setSalesmanUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<DispatchSortKey>("Default Sorting");
  const [selectedMapFitter, setSelectedMapFitter] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [dateFilterType, setDateFilterType] = useState<"today" | "tomorrow" | "custom">("today");

  const { locations: liveLocations } = useLiveLocation({
    onJobUpdated: (updatedJob) => {
      setJobs((prev) => {
        const exists = prev.some((j) => j._id === updatedJob._id);
        if (exists) {
          return prev.map((j) => (j._id === updatedJob._id ? updatedJob : j));
        }
        return [updatedJob, ...prev];
      });
    },
    onJobDeleted: (payload) => {
      setJobs((prev) => prev.filter((j) => j._id !== payload.id));
      if (selectedJobId === payload.id) {
        setSelectedJobId(null);
      }
    },
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editJobFormState, setEditJobFormState] = useState({
    id: "",
    firstName: "",
    lastName: "",
    customerPhone: "",
    address: "",
    scheduledDate: "",
    scheduledTime: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedSalesman: "",
    projectValue: "",
    notes: "",
    status: "pending" as "pending" | "scheduled" | "in_progress" | "completed" | "cancelled",
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [confirmActiveDelete, setConfirmActiveDelete] = useState(false);

  const [addressValue, setAddressValue] = useState("");
  const [mapCoords, setMapCoords] = useState<[number, number] | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionCacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch suggestions as user types
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
          new URLSearchParams({ ...Object.fromEntries(baseParams), viewbox: DUBAI_VIEWBOX, bounded: "1" }),
          new URLSearchParams({ ...Object.fromEntries(baseParams), viewbox: MALAPPURAM_VIEWBOX, bounded: "1" }),
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

  const handleAddressSelect = (address: string) => {
    setAddressValue(address);
    if (addressInputRef.current) {
      addressInputRef.current.value = address;
    }
  };

  const isAuthorized = useMemo(() => {
    return !!(user && ["owner", "sales_manager", "salesmanager", "admin"].includes(user.role?.toLowerCase() ?? ""));
  }, [user]);

  const handleCardAction = useCallback((actionType: string, jobId: string) => {
    if (!isAuthorized) {
      toast.error("Permission Denied: Only Managers can update or delete jobs.");
      return;
    }

    const rawJob = jobs.find((j) => j._id === jobId);
    if (!rawJob) return;

    if (actionType === "edit") {
      setEditJobFormState({
        id: rawJob._id,
        firstName: rawJob.firstName || "",
        lastName: rawJob.lastName || "",
        customerPhone: rawJob.customerPhone || "",
        address: rawJob.address || "",
        scheduledDate: rawJob.scheduledAt ? format(parseISO(rawJob.scheduledAt), "yyyy-MM-dd") : "",
        scheduledTime: rawJob.scheduledAt ? format(parseISO(rawJob.scheduledAt), "HH:mm") : "",
        priority: rawJob.priority || "medium",
        assignedSalesman: rawJob.assignedSalesman || rawJob.assignedTo || "",
        projectValue: rawJob.projectValue !== undefined ? String(rawJob.projectValue) : "",
        notes: rawJob.notes || "",
        status: rawJob.status || "pending",
      });
      setAddressValue(rawJob.address || "");
      if (rawJob.location?.coordinates && rawJob.location.coordinates.length >= 2) {
        setMapCoords([rawJob.location.coordinates[1], rawJob.location.coordinates[0]]);
      } else {
        setMapCoords(null);
      }
      setIsEditOpen(true);
    } else if (actionType === "delete") {
      setDeleteJobTarget(rawJob);
      setConfirmActiveDelete(false);
      setIsDeleteOpen(true);
    }
  }, [jobs, isAuthorized]);

  const handleSaveEdit = async () => {
    try {
      const { id, firstName, lastName, customerPhone, scheduledDate, scheduledTime, priority, assignedSalesman, projectValue, notes, status } = editJobFormState;

      if (!firstName.trim()) {
        toast.error("Customer First Name is required.");
        return;
      }
      if (!customerPhone.trim()) {
        toast.error("Customer Phone is required.");
        return;
      }
      if (!addressValue.trim()) {
        toast.error("Address is required.");
        return;
      }

      let scheduledAt: string | undefined = undefined;
      if (scheduledDate) {
        const timePart = scheduledTime || "09:00";
        scheduledAt = `${scheduledDate}T${timePart}:00.000Z`;
      }

      const assignedToId = assignedSalesman || undefined;

      let jobLocation = undefined;
      if (mapCoords && mapCoords[0] && mapCoords[1]) {
        jobLocation = {
          type: "Point",
          coordinates: [mapCoords[1], mapCoords[0]], // [lng, lat]
        };
      }

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        customerPhone: customerPhone.trim(),
        address: addressValue.trim(),
        scheduledAt,
        priority,
        assignedSalesman: assignedToId,
        assignedTo: assignedToId,
        projectValue: projectValue ? Number(projectValue) : undefined,
        notes: notes.trim(),
        status,
        location: jobLocation,
      };

      const updated = await updateJob(id, payload);
      
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success("Job updated successfully!");
      setIsEditOpen(false);

      const socket = getLiveLocationSocket();
      if (socket?.connected) {
        socket.emit("job:updated", updated);
      }
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Failed to update job."));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteJobTarget) return;

    try {
      const id = deleteJobTarget._id;
      const originalAssignedTo = deleteJobTarget.assignedSalesman || deleteJobTarget.assignedTo;

      await deleteJob(id);

      setJobs((current) => current.filter((item) => item._id !== id));
      if (selectedJobId === id) {
        setSelectedJobId(null);
      }
      toast.success(`Job ${getJobDisplayId(deleteJobTarget)} deleted successfully.`);
      setIsDeleteOpen(false);
      setDeleteJobTarget(null);

      const socket = getLiveLocationSocket();
      if (socket?.connected) {
        socket.emit("job:deleted", { id, assignedTo: originalAssignedTo });
      }
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Failed to delete job."));
    }
  };

  const isToday = isSameDay(viewDate, new Date());
  const isTomorrow = isSameDay(viewDate, addDays(new Date(), 1));

  const matchesDateFilter = useCallback((scheduledAtStr: string | undefined) => {
    if (!scheduledAtStr) {
      return false;
    }
    try {
      const jobDate = parseISO(scheduledAtStr);
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      if (dateFilterType === "today") {
        return isSameDay(jobDate, today);
      }
      if (dateFilterType === "tomorrow") {
        return isSameDay(jobDate, tomorrow);
      }
      if (dateFilterType === "custom") {
        return isSameDay(jobDate, viewDate);
      }
    } catch {
      return false;
    }
    return false;
  }, [dateFilterType, viewDate]);

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    setLoadError(null);

    try {
      const response = await getJobs({ limit: 100 });
      setJobs(response.items);
    } catch (error) {
      const message = getJobErrorMessage(error, "Unable to load jobs.");
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const loadSalesmen = useCallback(async () => {
    setIsLoadingUsers(true);

    try {
      const users = await getUsers();
      setAllUsers(users);
      setSalesmanUsers(users.filter(isSalesmanUser));
    } catch (error) {
      const message = getUserErrorMessage(error, "Unable to load salesmen for live assignment map.");
      toast.error(message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadSalesmen();
  }, [loadSalesmen]);

  const sortOptions = ["Default Sorting", "Nearest Agent", "Highest Value", "Date: Newest", "Urgent First", "Oldest Pending"];
  const handleSortChange = (sort: string) => {
    const map: Record<string, DispatchSortKey> = {
      "Default Sorting": "Default Sorting",
      "Nearest Agent": "nearest",
      "Highest Value": "highest_value",
      "Date: Newest": "newest",
      "Urgent First": "urgent_first",
      "Oldest Pending": "oldest_pending",
    };
    setSortKey(map[sort] ?? "Default Sorting");
  };
  const currentSortLabel = sortOptions.find((option) => ({
    "Default Sorting": "Default Sorting",
    "Nearest Agent": "nearest",
    "Highest Value": "highest_value",
    "Date: Newest": "newest",
    "Urgent First": "urgent_first",
    "Oldest Pending": "oldest_pending",
  })[option] === sortKey) ?? "Default Sorting";

  const [dialogState, setDialogState] = useState<{
    type: "assign" | "edit";
    jobId: string;
    jobClient: string;
    fitterId?: string;
    salesmanId?: string;
    originalFitterId?: string;
    originalSalesmanId?: string;
    currentSlot?: string;
    currentDate?: Date;
    requestedDate?: string;
  } | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState<string>("09:00");

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    allUsers.forEach((u) => map.set(u._id, u.name));
    baseFitters.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [baseFitters, allUsers]);

  const fitters = useMemo<Fitter[]>(() => {
    return baseFitters.map((fitter) => {
      const assignedJobs = jobs.filter((job) => {
        if (!["scheduled", "in_progress", "completed"].includes(job.status)) {
          return false;
        }
        if (job.assignedFitter === fitter.id || job.assignedTo === fitter.id) return true;
        if (job.assignedTo && job.assignedTo.toLowerCase() === fitter.name.toLowerCase()) return true;

        const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
        return match?.[1]?.trim().toLowerCase() === fitter.name.toLowerCase();
      });

      const today = assignedJobs.filter((job) => isJobForDate(job, new Date())).map(toFitterJob);
      const tomorrow = assignedJobs.filter((job) => isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob);
      const current = isToday ? today.length : isTomorrow ? tomorrow.length : 0;
      const remaining = Math.max(0, (fitter.capacity?.max || 5) - current);
      const busySlots = isToday ? today.map((job) => job.time) : isTomorrow ? tomorrow.map((job) => job.time) : [];
      const nextAvailableSlot = DAILY_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";

      return {
        ...fitter,
        status: remaining === 0 ? "Fully Booked" : fitter.status === "Fully Booked" ? "Available" : fitter.status,
        schedule: {
          yesterday: [],
          today,
          tomorrow,
          upcoming: assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, new Date()) && !isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob),
        },
        capacity: {
          max: fitter.capacity?.max || 5,
          current,
          remaining,
        },
        nextAvailableSlot,
      };
    });
  }, [baseFitters, jobs, isToday, isTomorrow]);

  const selectedPendingJobForMap = useMemo(() => {
    if (!selectedJobId) return undefined;
    const job = jobs.find((j) => j._id === selectedJobId && j.status === "pending");
    if (!job) return undefined;
    
    let lat = 10.8505;
    let lng = 76.2711;
    if (job.location?.coordinates && job.location.coordinates.length >= 2) {
      lng = job.location.coordinates[0];
      lat = job.location.coordinates[1];
    }
    
    return {
      id: job._id,
      jobId: job.jobId,
      location: { lat, lng },
      address: job.address || "Pending Job Location",
      client: job.customerName || "Client"
    };
  }, [selectedJobId, jobs]);

  const salesmen = useMemo<Fitter[]>(() => {
    return salesmanUsers.map((user) => {
      const salesmanName = user.name;
      const assignedJobs = jobs.filter((job) => {
        if (!["scheduled", "in_progress", "completed", "pending"].includes(job.status)) {
          return false;
        }
        return isAssignedToFitter(job, user);
      });

      const activeWorkflowJob = assignedJobs.find((job) => job.salesmanWorkflowStatus === "travelling" || job.salesmanWorkflowStatus === "measuring");
      const today = assignedJobs.filter((job) => isJobForDate(job, new Date())).map(toFitterJob);
      const tomorrow = assignedJobs.filter((job) => isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob);
      const activeJob = activeWorkflowJob
        ? toFitterJob(activeWorkflowJob)
        : today.find((j) => j.status === "In Progress" || j.status === "On the way") ?? today.find((j) => j.status === "Pending") ?? tomorrow.find((j) => j.status === "In Progress" || j.status === "On the way") ?? tomorrow.find((j) => j.status === "Pending");
      const current = isToday ? today.length : isTomorrow ? tomorrow.length : 0;
      const maxCapacity = 999;
      const remaining = Math.max(0, maxCapacity - current);
      const busySlots = isToday ? today.map((job) => job.time) : isTomorrow ? tomorrow.map((job) => job.time) : [];
      const nextAvailableSlot = DAILY_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";

      return {
        id: user._id,
        name: user.name,
        role: "Salesman",
        jobRef: activeJob?.id ?? "--",
        status: remaining === 0 && maxCapacity !== 999
          ? "Fully Booked"
          : getSalesmanMapStatus(activeWorkflowJob, user.liveStatus ?? "Available"),
        location: (() => { 
            const liveLoc = liveLocations?.find(loc => loc.userId === user._id);
            if (liveLoc) {
                return [liveLoc.lat, liveLoc.lng] as [number, number];
            }
            const ll = extractLatLng(user.location); 
            if (ll) return [ll.lat, ll.lng] as [number, number];
            if (selectedPendingJobForMap?.location) {
                return [
                    selectedPendingJobForMap.location.lat + (Math.random() - 0.5) * 0.05, 
                    selectedPendingJobForMap.location.lng + (Math.random() - 0.5) * 0.05
                ] as [number, number];
            }
            return [10.8505, 76.2711] as [number, number];
        })(),
        locationLabel: (() => {
            const liveLoc = liveLocations?.find(loc => loc.userId === user._id);
            if (liveLoc) return "Live GPS Tracking";
            return user.location?.address || "Simulated Location";
        })(),
        lastUpdated: (() => { const u = user.location?.updatedAt; if (!u) return "Not updated"; try { return typeof u === "string" ? toReadableLastUpdated(u) : toReadableLastUpdated(new Date(u).toISOString()); } catch { return "Not updated"; } })(),
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        history: [],
        schedule: {
          yesterday: [],
          today,
          tomorrow,
          upcoming: assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, new Date()) && !isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob),
        },
        capacity: {
          max: maxCapacity,
          current,
          remaining,
        },
        nextAvailableSlot,
      };
    });
  }, [salesmanUsers, jobs, isToday, isTomorrow, liveLocations, selectedPendingJobForMap]);

  const workforceMembers = useMemo<Fitter[]>(() => {
    return salesmen;
  }, [salesmen]);

  const resolveUnifiedJob = useCallback((job: Job): UnifiedJob => {
    const raw = toUnifiedJob(job);

    const resolveRefName = (ref: any): string | undefined => {
      if (!ref) return undefined;
      if (typeof ref === "object" && ref !== null && typeof ref.name === "string") {
        return ref.name;
      }
      if (typeof ref === "string") {
        const fromMap = userNameById.get(ref);
        if (fromMap) return fromMap;
        if (!ref.match(/^[a-f0-9]{24}$/i)) return ref;
      }
      return undefined;
    };

    let assignedFitterName = resolveRefName(job.assignedFitter);
    let assignedSalesmanName = resolveRefName(job.assignedSalesman) || resolveRefName(job.assignedTo);

    let teamName = "Assigned Team";
    if (!assignedFitterName && !assignedSalesmanName) {
      teamName = resolveAssignedFitterName(job, userNameById);
    } else {
      const parts = [];
      if (assignedFitterName) parts.push(assignedFitterName);
      if (assignedSalesmanName) parts.push(assignedSalesmanName);
      teamName = parts.join(" & ");
    }

    let assignedBy = resolveRefName(raw.assignedBy) || raw.assignedBy;

    return { 
      ...raw, 
      team: teamName, 
      assignedFitterName, 
      assignedSalesmanName, 
      assignedBy,
      assignedSalesman: job.assignedSalesman,
      assignedTo: job.assignedTo,
      assignedFitter: job.assignedFitter,
    };
  }, [userNameById]);

  const pendingJobs = useMemo(
    () => sortUnifiedJobs(jobs.filter((job) => job.status === "pending" && !job.quotation && matchesDateFilter(job.scheduledAt)).map(resolveUnifiedJob), sortKey),
    [jobs, sortKey, resolveUnifiedJob, matchesDateFilter]
  );
  const activeJobs = useMemo(
    () => sortUnifiedJobs(jobs.filter((job) => ["scheduled", "in_progress"].includes(job.status) && matchesDateFilter(job.scheduledAt)).map(resolveUnifiedJob), sortKey),
    [jobs, sortKey, resolveUnifiedJob, matchesDateFilter],
  );

  const unassignedJobsForMap = useMemo(() => jobs
    .filter((job) => job.status === "pending" && !job.quotation && matchesDateFilter(job.scheduledAt))
    .map((job) => {
      const coordinates = job.location?.coordinates;
      const lng = coordinates?.[0] ?? 76.2711;
      const lat = coordinates?.[1] ?? 10.8505;
      return {
        id: job._id,
        jobId: job.jobId,
        location: { lat, lng },
        address: job.address || "Pending Job Location",
        client: job.customerName || "Client",
        value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
        time: toDisplayTime(job.scheduledAt) ?? "10:00",
        property: job.propertyType,
        productType: job.productType,
      };
    }), [jobs, matchesDateFilter]);

  const scheduledJobsForMap = useMemo(() => jobs
    .filter((job) => ["scheduled", "in_progress"].includes(job.status) && matchesDateFilter(job.scheduledAt))
    .map((job) => {
      const coordinates = job.location?.coordinates;
      const lng = coordinates?.[0] ?? 76.2711;
      const lat = coordinates?.[1] ?? 10.8505;
      return {
        id: job._id,
        jobId: job.jobId,
        location: { lat, lng },
        address: job.address || "Scheduled Job Location",
        client: job.customerName || "Client",
        status: getSalesmanWorkflowDisplayStatus(job),
        assignedSalesmanId: job.assignedSalesman || job.assignedTo,
        value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
        time: toDisplayTime(job.scheduledAt) ?? "10:00",
        property: job.propertyType,
        productType: job.productType,
      };
    }), [jobs, matchesDateFilter]);



  const [roadData, setRoadData] = useState<Record<string, {
    distToNewJob: number;
    durationToNewJob: number;
    distToActiveJob?: number;
    durationToActiveJob?: number;
  }>>({});

  useEffect(() => {
    if (!selectedJobId || !selectedPendingJobForMap) {
      setRoadData({});
      return;
    }

    let active = true;

    const getRouteData = async (start: [number, number], end: { lat: number; lng: number }) => {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end.lng},${end.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("OSRM error");
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const dist = data.routes[0].distance / 1000; // in km
        const rawDuration = data.routes[0].duration; // in seconds
        
        let trafficMultiplier = 1.25;
        if (dist < 10) {
          trafficMultiplier = 1.40;
        } else if (dist < 30) {
          trafficMultiplier = 1.30;
        } else {
          trafficMultiplier = 1.20;
        }
        const intersectionBuffer = dist * 15;
        const duration = Math.round(rawDuration * trafficMultiplier + intersectionBuffer);
        return { dist, duration };
      }
      throw new Error("No route found");
    };

    const getFallbackRouteData = (start: [number, number], end: [number, number]) => {
      const R = 6371; 
      const dLat = (end[0] - start[0]) * Math.PI / 180;
      const dLon = (end[1] - start[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      const duration = (dist / 32) * 3600;
      return { dist, duration };
    };

    const fetchRoadDistances = async () => {
      const newData: Record<string, {
        distToNewJob: number;
        durationToNewJob: number;
        distToActiveJob?: number;
        durationToActiveJob?: number;
      }> = {};
      
      const membersToFetch = workforceMembers.filter(m => m.location && m.capacity.remaining > 0);
      
      await Promise.all(
        membersToFetch.map(async (member) => {
          if (!member.location) return;
          try {
            const rawActiveJob = jobs.find(j => j._id === member.jobRef);
            let activeJobLocation: { lat: number; lng: number } | null = null;
            if (rawActiveJob?.location?.coordinates && rawActiveJob.location.coordinates.length >= 2) {
              activeJobLocation = {
                lng: rawActiveJob.location.coordinates[0],
                lat: rawActiveJob.location.coordinates[1],
              };
            }

            const statusLower = member.status?.toLowerCase() ?? "";
            const isMeasuring = statusLower.includes("progress") || statusLower.includes("working");
            const isOnTheWay = statusLower.includes("way");

            // 1. Fetch direct route (from current location to new job) for visual distance
            let distToNewJob = 0;
            let directDuration = 0;
            try {
              const route = await getRouteData(member.location, selectedPendingJobForMap.location);
              distToNewJob = route.dist;
              directDuration = route.duration;
            } catch (err) {
              console.warn(`Fallback for member ${member.id} direct route`, err);
              const fallback = getFallbackRouteData(member.location, [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
              distToNewJob = fallback.dist;
              directDuration = fallback.duration;
            }

            // 2. Fetch active job leg if they are on the way
            let distToActiveJob: number | undefined;
            let durationToActiveJob: number | undefined;

            if (isOnTheWay && activeJobLocation) {
              try {
                const route = await getRouteData(member.location, activeJobLocation);
                distToActiveJob = route.dist;
                durationToActiveJob = route.duration;
              } catch (err) {
                console.warn(`Fallback for member ${member.id} to active job`, err);
              }
            }

            // 3. Fetch second leg duration (from active job to new job) if they are busy
            let durationToNewJob = directDuration; // Default to direct duration if they are available
            if (activeJobLocation && (isMeasuring || isOnTheWay)) {
              try {
                const route = await getRouteData([activeJobLocation.lat, activeJobLocation.lng], selectedPendingJobForMap.location);
                durationToNewJob = route.duration;
              } catch (err) {
                console.warn(`Fallback for member ${member.id} active job to new job`, err);
                const fallback = getFallbackRouteData([activeJobLocation.lat, activeJobLocation.lng], [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
                durationToNewJob = fallback.duration;
              }
            }

            newData[member.id] = {
              distToNewJob,
              durationToNewJob,
              distToActiveJob,
              durationToActiveJob,
            };
          } catch (err) {
            console.error(`Failed to fetch road distance for member ${member.id}`, err);
          }
        })
      );

      if (active) {
        setRoadData(newData);
      }
    };

    fetchRoadDistances();

    return () => {
      active = false;
    };
  }, [selectedJobId, selectedPendingJobForMap, workforceMembers, jobs]);

  const recommendedFitters = useMemo(() => {
    if (!selectedJobId || !selectedPendingJobForMap) return [];

    const result = workforceMembers
      .filter((member) => member.capacity.remaining > 0)
      .map((member) => {
        const rawActiveJob = jobs.find(j => j._id === member.jobRef);
        let activeJobLocation: { lat: number; lng: number } | null = null;
        if (rawActiveJob?.location?.coordinates && rawActiveJob.location.coordinates.length >= 2) {
          activeJobLocation = {
            lng: rawActiveJob.location.coordinates[0],
            lat: rawActiveJob.location.coordinates[1],
          };
        }

        const statusLower = member.status?.toLowerCase() ?? "";
        const isMeasuring = statusLower.includes("progress") || statusLower.includes("working");
        const isOnTheWay = statusLower.includes("way");

        const getFallback = (start: [number, number], end: [number, number]) => {
          const R = 6371; 
          const dLat = (end[0] - start[0]) * Math.PI / 180;
          const dLon = (end[1] - start[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;
          const duration = (dist / 32) * 3600;
          return { dist, duration };
        };

        let durationToActiveJob = 0;
        if (isOnTheWay && activeJobLocation && member.location) {
          const data = roadData[member.id];
          if (data?.durationToActiveJob !== undefined) {
            durationToActiveJob = data.durationToActiveJob;
          } else {
            durationToActiveJob = getFallback(member.location, [activeJobLocation.lat, activeJobLocation.lng]).duration;
          }
        }

        let distToNewJob = 0;
        let durationToNewJob = 0;

        if (member.location && selectedPendingJobForMap.location) {
          const data = roadData[member.id];
          if (data?.distToNewJob !== undefined) {
            distToNewJob = data.distToNewJob;
            durationToNewJob = data.durationToNewJob;
          } else {
            const fbDirect = getFallback(member.location, [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
            distToNewJob = fbDirect.dist;

            if (activeJobLocation && (isMeasuring || isOnTheWay)) {
              const fbActiveToNew = getFallback([activeJobLocation.lat, activeJobLocation.lng], [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
              durationToNewJob = fbActiveToNew.duration;
            } else {
              durationToNewJob = fbDirect.duration;
            }
          }
        }

        let measureTimeSecs = 0;
        const activeJob = member.schedule.today.find(j => j.id === member.jobRef);
        let countdownSecs = -1;

        if (isMeasuring) {
          if (activeJob && activeJob.status === "In Progress" && activeJob.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(activeJob.timerStartedAt).getTime()) / 1000);
            const remaining = (45 * 60) - elapsed;
            countdownSecs = remaining > 0 ? remaining : 0;
          }
          measureTimeSecs = countdownSecs >= 0 ? countdownSecs : (45 * 60);
        } else if (isOnTheWay) {
          measureTimeSecs = 45 * 60;
        }

        const duration = durationToActiveJob + measureTimeSecs + durationToNewJob;

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          dist: distToNewJob,
          duration,
          countdownSecs,
          timerStartedAt: activeJob?.timerStartedAt,
          isFree: member.status === "Available"
        };
      });

    return result.sort((a, b) => {
       if (a.isFree && !b.isFree) return -1;
       if (!a.isFree && b.isFree) return 1;

       if (a.duration !== undefined && b.duration !== undefined) {
          return a.duration - b.duration;
       }
       if (a.dist !== undefined && b.dist !== undefined) return a.dist - b.dist;
       return 0;
    });
  }, [selectedJobId, workforceMembers, selectedPendingJobForMap, roadData, jobs]);

  const initiateAssignment = (jobId: string, memberId?: string) => {
    const member = memberId ? workforceMembers.find((item) => item.id === memberId) : undefined;
    const job = [...pendingJobs, ...activeJobs].find((item) => item.id === jobId);
    if (!job) return;

    if (member && member.capacity.remaining <= 0) {
      toast.error("Compliance Error: Maximum daily capacity reached.");
      return;
    }

    const sourceJob = jobs.find((item) => item._id === jobId);

    let targetDate = viewDate;
    let targetTime = "09:00";

    if (sourceJob?.scheduledAt) {
      try {
        const parsed = parseISO(sourceJob.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
          targetTime = format(parsed, "HH:mm");
        }
      } catch (e) {
        // fallback
      }
    }

    setRescheduleDate(targetDate);
    setCustomTime(targetTime);
    setDialogState({
      type: "assign",
      jobId,
      jobClient: job.client,
      fitterId: member && member.role === "Fitter" ? member.id : sourceJob?.assignedFitter,
      salesmanId: member && member.role === "Salesman" ? member.id : sourceJob?.assignedSalesman,
      currentDate: viewDate,
      requestedDate: getRequestedDateDisplay(sourceJob as Job),
    });
  };

  const initiateEdit = (jobId: string, jobTime: string, jobClient: string) => {
    const sourceJob = jobs.find((item) => item._id === jobId);

    let targetDate = viewDate;
    if (sourceJob?.scheduledAt) {
      try {
        const parsed = parseISO(sourceJob.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      } catch (e) {
        // fallback
      }
    }

    setRescheduleDate(targetDate);
    setCustomTime(jobTime || "09:00");
    setDialogState({
      type: "edit",
      jobId,
      jobClient,
      fitterId: sourceJob?.assignedFitter || sourceJob?.assignedTo,
      salesmanId: sourceJob?.assignedSalesman,
      originalFitterId: sourceJob?.assignedFitter || sourceJob?.assignedTo,
      originalSalesmanId: sourceJob?.assignedSalesman,
      currentSlot: jobTime,
      currentDate: viewDate,
      requestedDate: getRequestedDateDisplay(sourceJob as Job),
    });
  };

  const openRescheduleForJob = (job: UnifiedJob) => {
    const sourceJob = jobs.find((item) => item._id === job.id);
    const scheduledTime = job.time ?? toDisplayTime(sourceJob?.scheduledAt) ?? "08:00";

    setSelectedJobId(job.id);
    initiateEdit(job.id, scheduledTime, job.client);
  };

  const handleDialogFitterChange = (fitterId: string) => {
    setDialogState((current) => current ? {
      ...current,
      fitterId,
    } : current);
  };

  const handleDialogSalesmanChange = (salesmanId: string) => {
    setDialogState((current) => current ? {
      ...current,
      salesmanId,
    } : current);
  };

  const confirmAction = async (timeSlot: string) => {
    if (!dialogState || !rescheduleDate) return;
    if (!dialogState.salesmanId) {
      toast.error("Please select a Salesman");
      return;
    }

    const newDateStr = format(rescheduleDate, "yyyy-MM-dd");
    const scheduledAt = selectedDateFromSlot(rescheduleDate, timeSlot);

    try {
      const assignedName = [
        dialogState.fitterId ? userNameById.get(dialogState.fitterId) : null,
        dialogState.salesmanId ? userNameById.get(dialogState.salesmanId) : null
      ].filter(Boolean).join(" & ");

      const assignedToId = dialogState.salesmanId || dialogState.fitterId;
      const sourceJob = jobs.find((item) => item._id === dialogState.jobId);

      const updated = await updateJob(dialogState.jobId, {
        status: "scheduled",
        scheduledAt,
        assignedTo: assignedToId,
        assignedFitter: dialogState.fitterId,
        assignedSalesman: dialogState.salesmanId,
        assignedBy: user?._id || user?.name || "Sales Manager",
        notes: `${sourceJob?.notes ? sourceJob.notes + '\n\n' : ''}Assigned to ${assignedName} @ ${timeSlot}. Scheduled by ${user?.name || "Sales Manager"} from Smart Dispatch.`,
      });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(dialogState.type === "assign" ? `Assigned to ${assignedName} on ${newDateStr} @ ${timeSlot}` : `Rescheduled to ${newDateStr} @ ${timeSlot}`);
      setDialogState(null);
      setSelectedJobId(null);
      setSelectedMapFitter(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Dispatch operation failed."));
    }
  };

  const handleUnassign = async () => {
    if (!dialogState) return;

    try {
      const updated = await updateJob(dialogState.jobId, {
        status: "pending",
        assignedTo: "",
        assignedFitter: "",
        assignedSalesman: "",
        assignedBy: "",
        notes: "Returned to pending queue from Smart Dispatch.",
      });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.info("Unassigned. Job returned to pending.");
      setDialogState(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to unassign job."));
    }
  };

  const isLoading = !isLoaded || isLoadingJobs || isLoadingUsers;

  // ── Tab System ──────────────────────────────────────────────────────────────
  type DashTab = "fleet" | "appointments" | "leads" | "measuring" | "performance";
  const [activeTab, setActiveTab] = useState<DashTab>("fleet");
  const [apptFilter, setApptFilter] = useState<"today" | "tomorrow" | "upcoming" | "completed">("today");
  const [tabSearch, setTabSearch] = useState("");
  const [leadPriorityFilter, setLeadPriorityFilter] = useState<string>("all");
  const [leadFilter, setLeadFilter] = useState<"pending" | "scheduled">("pending");
  const [apptSortKey, setApptSortKey] = useState<string>("time");

  // 1. Appointments Data
  const filteredAppointments = useMemo(() => {
    let list = jobs.filter(job => ["scheduled", "in_progress", "completed"].includes(job.status));
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (apptFilter === "today") {
      list = list.filter(j => j.status !== "completed" && j.scheduledAt && isSameDay(parseISO(j.scheduledAt), today));
    } else if (apptFilter === "tomorrow") {
      list = list.filter(j => j.status !== "completed" && j.scheduledAt && isSameDay(parseISO(j.scheduledAt), tomorrow));
    } else if (apptFilter === "upcoming") {
      list = list.filter(j => j.status !== "completed" && j.scheduledAt && parseISO(j.scheduledAt) > tomorrow);
    } else if (apptFilter === "completed") {
      list = list.filter(j => j.status === "completed");
    }

    if (tabSearch) {
      const lower = tabSearch.toLowerCase();
      list = list.filter(j => 
        j.firstName.toLowerCase().includes(lower) || 
        j.lastName.toLowerCase().includes(lower) || 
        j.customerName.toLowerCase().includes(lower) || 
        j.address.toLowerCase().includes(lower) ||
        (j.jobId && j.jobId.toLowerCase().includes(lower))
      );
    }

    // Sort key
    if (apptSortKey === "time") {
      list.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
    } else if (apptSortKey === "name") {
      list.sort((a, b) => a.customerName.localeCompare(b.customerName));
    } else if (apptSortKey === "value") {
      list.sort((a, b) => (b.projectValue || 0) - (a.projectValue || 0));
    }
    return list.map(toUnifiedJob);
  }, [jobs, apptFilter, tabSearch, apptSortKey]);

  // 2. Unassigned Leads Data
  const filteredUnassignedLeads = useMemo(() => {
    let list = jobs.filter(job => {
      if (leadFilter === "pending") {
        return job.status === "pending";
      } else {
        return job.status === "scheduled" && !job.assignedSalesman && !job.assignedTo;
      }
    });

    if (leadPriorityFilter !== "all") {
      list = list.filter(j => j.priority === leadPriorityFilter);
    }

    if (tabSearch) {
      const lower = tabSearch.toLowerCase();
      list = list.filter(j => 
        j.firstName.toLowerCase().includes(lower) || 
        j.lastName.toLowerCase().includes(lower) || 
        j.customerName.toLowerCase().includes(lower) || 
        j.address.toLowerCase().includes(lower) ||
        (j.jobId && j.jobId.toLowerCase().includes(lower))
      );
    }

    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    list.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    return list.map(toUnifiedJob);
  }, [jobs, leadPriorityFilter, leadFilter, tabSearch]);

  // 3. Measuring Data
  const measuringSalesmen = useMemo(() => {
    return workforceMembers.filter(f => 
      (f.status as string) === "Measuring" || 
      (f.status as string) === "Working" ||
      f.schedule.today.some(j => j.status === "In Progress")
    );
  }, [workforceMembers]);

  // 4. Performance Metrics
  const performanceMetrics = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === "completed").length;
    const pending = jobs.filter(j => j.status === "pending").length;
    const scheduled = jobs.filter(j => j.status === "scheduled" || j.status === "in_progress").length;
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const revenue = jobs.reduce((sum, j) => sum + (j.projectValue || 0), 0);
    
    // Group jobs by salesman
    const salesmanJobs: Record<string, { total: number; completed: number; revenue: number; name: string }> = {};
    
    // Seed with all current active salesmen to ensure they show up in analytics
    workforceMembers.forEach(salesman => {
      salesmanJobs[salesman.id] = { total: 0, completed: 0, revenue: 0, name: salesman.name };
    });

    jobs.forEach(j => {
      const salesmanId = j.assignedTo || j.activeSalesmanId;
      if (salesmanId && salesmanJobs[salesmanId]) {
        salesmanJobs[salesmanId].total += 1;
        if (j.status === "completed") {
          salesmanJobs[salesmanId].completed += 1;
          salesmanJobs[salesmanId].revenue += j.projectValue || 0;
        }
      }
    });

    return {
      total,
      completed,
      pending,
      scheduled,
      conversionRate,
      revenue,
      salesmanLeaderboard: Object.entries(salesmanJobs).map(([id, stats]) => ({
        id,
        ...stats,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      })).sort((a, b) => b.completed - a.completed),
    };
  }, [jobs, workforceMembers]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 w-full font-sans">
     

      {/* ── Main Content Body Split ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: LIVE FLEET VIEW (Default Dispatch Side panel + Map) */}
        {activeTab === "fleet" && (
          <>
            <div className="w-full xl:w-[500px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl shrink-0">
              <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
                <div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2">
                    <div className="w-8 h-px bg-amber-600"></div>
                    <span>Workforce Optimization</span>
                  </div>
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-3xl font-light text-slate-900 tracking-tight">Smart <span className="font-medium">Dispatch</span></h2>
                  </div>
                </div>

                {/* Date Filter Panel */}
                <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <button
                    onClick={() => {
                      setDateFilterType("today");
                      setViewDate(new Date());
                    }}
                    className={cn(
                      "flex-1 h-7 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center",
                      dateFilterType === "today"
                        ? "bg-white shadow-sm text-slate-900 border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      setDateFilterType("tomorrow");
                      setViewDate(addDays(new Date(), 1));
                    }}
                    className={cn(
                      "flex-1 h-7 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center",
                      dateFilterType === "tomorrow"
                        ? "bg-white shadow-sm text-slate-900 border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                  >
                    Tomorrow
                  </button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 h-7 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 min-w-0",
                          dateFilterType === "custom"
                            ? "bg-white shadow-sm text-slate-900 border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                      >
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {dateFilterType === "custom" ? format(viewDate, "MMM do") : "Date"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={viewDate}
                        onSelect={(date) => {
                          if (date) {
                            setDateFilterType("custom");
                            setViewDate(date);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                <FilterSortBar
                  onFilterClick={() => {
                    toast.info("Showing today's live field list. Use date filters to check schedules.");
                    loadJobs();
                  }}
                  onSortChange={handleSortChange}
                  currentSort={currentSortLabel}
                  sortOptions={sortOptions}
                  className="border-b border-slate-200/60"
                />

                {(isLoading || loadError) && (
                  <div className={cn("px-6 py-2 text-[10px] uppercase tracking-widest font-bold border-b", loadError ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
                    {loadError ?? "Updating live presence queue..."}
                  </div>
                )}

                <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
                  <div className="px-6 pt-4 bg-white border-b border-slate-100 pb-0">
                    <TabsList className="bg-slate-100 p-1 rounded-xl w-full flex h-auto gap-1">
                      <TabsTrigger value="pending" className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-slate-200/50">
                        <span className="mr-2">Pending</span>
                        {pendingJobs.length > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md text-[9px]">{pendingJobs.length}</span>}
                      </TabsTrigger>
                      <TabsTrigger value="active" className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-slate-200/50">
                        <span className="mr-2">Scheduled</span>
                        {activeJobs.length > 0 && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[9px]">{activeJobs.length}</span>}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="pending" className="flex-1 overflow-y-auto outline-none p-4 pr-3 scrollbar-container min-h-0">
                    <div className="space-y-3">
                      {pendingJobs.map((job) => {
                        const isSelected = selectedJobId === job.id;
                        
                        // Simple distance based suggested fitter
                        const suggestedFitter = (() => {
                          const available = workforceMembers.filter(f => f.location && f.status === "Available");
                          if (available.length === 0) return null;
                          const sourceJob = jobs.find(item => item._id === job.id);
                          if (!sourceJob || !sourceJob.location?.coordinates) return null;
                          const jobLatLng: [number, number] = [sourceJob.location.coordinates[1], sourceJob.location.coordinates[0]];
                          const mapped = available.map(f => ({
                            fitter: f,
                            dist: distanceKm(f.location!, jobLatLng)
                          }));
                          mapped.sort((a, b) => a.dist - b.dist);
                          return mapped[0];
                        })();

                        const cardRecommendedFitters = isSelected 
                          ? recommendedFitters 
                          : (suggestedFitter ? [{
                              id: suggestedFitter.fitter.id,
                              name: suggestedFitter.fitter.name,
                              dist: suggestedFitter.dist,
                              isFree: true
                            }] : []);

                        return (
                          <JobCard
                            key={job.id}
                            job={{ ...job, recommendedFitters: cardRecommendedFitters }}
                            isSelected={isSelected}
                            onSelect={() => setSelectedJobId(isSelected ? null : job.id)}
                            onAction={(action, payload) => {
                              if (action === "assign") {
                                initiateAssignment(job.id, payload);
                              } else {
                                handleCardAction(action, job.id);
                              }
                            }}
                            showEditDelete={isAuthorized}
                            variant="assignment"
                          />
                        );
                      })}
                      {!isLoading && pendingJobs.length === 0 && <div className="text-center py-12 text-slate-400 text-xs italic">No pending leads remaining.</div>}
                    </div>
                  </TabsContent>

                  <TabsContent value="active" className="flex-1 overflow-y-auto outline-none p-4 min-h-0">
                    <div className="space-y-3">
                      {activeJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isSelected={selectedJobId === job.id}
                          onSelect={() => openRescheduleForJob(job)}
                          onAction={(action) => {
                            if (action === "manage") {
                              openRescheduleForJob(job);
                            } else {
                              handleCardAction(action, job.id);
                            }
                          }}
                          showEditDelete={isAuthorized}
                          variant="schedule"
                        />
                      ))}
                      {!isLoading && activeJobs.length === 0 && <div className="text-center py-12 text-slate-400 text-xs italic">No appointments scheduled for this date.</div>}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Right Map */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden">
              <AssignmentMap
                fitters={workforceMembers}
                selectedFitterId={selectedMapFitter}
                onSelectFitter={setSelectedMapFitter}
                filterRole="Salesman"
                selectedJob={selectedPendingJobForMap}
                hideStatusPanel={false}
                unassignedJobs={unassignedJobsForMap}
                scheduledJobs={scheduledJobsForMap}
              />
              {/* Legend Overlay */}
              <div className="absolute bottom-6 left-6 z-30 bg-white/80 backdrop-blur-md border border-white/50 p-4 shadow-2xl rounded-2xl max-w-sm ring-1 ring-black/5">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Live Fleet Status</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Measuring</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> On The Way</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline</div>
                </div>
              </div>
              {/* Selected Salesman Details Card */}
              {selectedMapFitter && (
                <div className="absolute top-6 right-6 z-30 w-96 bg-white/95 backdrop-blur-md shadow-2xl border border-slate-200 animate-in slide-in-from-right-4 flex flex-col max-h-[calc(100vh-10rem)] rounded-2xl overflow-hidden ring-1 ring-black/5">
                  {(() => {
                    const fitter = workforceMembers.find((item) => item.id === selectedMapFitter) || (() => {
                      const userObj = allUsers.find(u => u._id === selectedMapFitter);
                      if (!userObj) return null;
                      const ll = extractLatLng(userObj.location);
                      return {
                        id: userObj._id,
                        name: userObj.name,
                        role: userObj.role === "sales_manager" ? "Sales Manager" : userObj.role,
                        avatar: userObj.avatar,
                        phone: userObj.phone,
                        status: userObj.liveStatus || "Available",
                        location: ll ? [ll.lat, ll.lng] as [number, number] : undefined,
                        lastUpdated: "Not updated",
                        schedule: { yesterday: [], today: [], tomorrow: [], upcoming: [] },
                        capacity: { max: 5, current: 0, remaining: 5 },
                        nextAvailableSlot: "08:00",
                        jobRef: undefined,
                        history: []
                      } as unknown as Fitter;
                    })();
                    if (!fitter) return null;
                    const activeSchedule = isToday ? fitter.schedule.today : isTomorrow ? fitter.schedule.tomorrow : [];
                    const capacityPercent = (activeSchedule.length / fitter.capacity.max) * 100;
                    const activeJobObj = fitter.schedule.today.find(j => j.id === fitter.jobRef) ?? 
                                         fitter.schedule.tomorrow.find(j => j.id === fitter.jobRef) ?? 
                                         fitter.schedule.upcoming.find(j => j.id === fitter.jobRef);
                    return (
                      <>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 rounded-xl border border-white shadow bg-white"><AvatarImage src={fitter.avatar} /><AvatarFallback>{getInitials(fitter.name)}</AvatarFallback></Avatar>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 leading-snug">{fitter.name}</h3>
                              <p className="text-[10px] text-slate-500 font-medium">Sales Representative • {fitter.status}</p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedMapFitter(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                          {fitter.locationLabel && (
                            <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 rounded-xl p-3">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Last Location</span>
                                <span className="leading-snug text-slate-700">{fitter.locationLabel}</span>
                                <span className="text-[9px] text-slate-400 mt-1 font-semibold">Updated {fitter.lastUpdated}</span>
                              </div>
                            </div>
                          )}

                          {activeJobObj && (
                            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 space-y-2">
                              <div className="flex justify-between items-center pb-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Telemetry Info</span>
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                  Current Job
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">CUSTOMER</span>
                                  <span className="font-bold text-slate-800">{activeJobObj.client}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">ADDRESS</span>
                                  <span className="text-slate-700 leading-normal">{activeJobObj.address}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">JOB ID</span>
                                  <span className="font-mono text-slate-800 font-bold">{activeJobObj.jobId || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block mb-0.5">WORK STATUS</span>
                                  <span className="font-semibold text-indigo-600">{activeJobObj.status}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: APPOINTMENTS VIEW */}
        {activeTab === "appointments" && (
          <>
            <div className="w-full xl:w-[480px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl shrink-0">
              <div className="p-6 border-b border-slate-100 shrink-0 space-y-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                    <div className="w-6 h-px bg-blue-600"></div>
                    <span>Customer Visits Schedule</span>
                  </div>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">Active <span className="font-semibold text-slate-900">Appointments</span></h2>
                </div>

                {/* Sub-Filters: Today, Tomorrow, Upcoming, Completed */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 gap-0.5 w-full">
                  <button
                    onClick={() => setApptFilter("today")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                      apptFilter === "today" ? "bg-white text-blue-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setApptFilter("tomorrow")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                      apptFilter === "tomorrow" ? "bg-white text-blue-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => setApptFilter("upcoming")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                      apptFilter === "upcoming" ? "bg-white text-blue-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Upcoming
                  </button>
                  {/* <button
                    onClick={() => setApptFilter("completed")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                      apptFilter === "completed" ? "bg-white text-blue-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Completed
                  </button> */}
                </div>

                {/* Search & Sort controls */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search appointments..."
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    />
                  </div>
                  <Select value={apptSortKey} onValueChange={setApptSortKey}>
                    <SelectTrigger className="w-28 h-9 border-slate-200 bg-slate-50 text-xs rounded-xl font-semibold">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time Slot</SelectItem>
                      <SelectItem value="name">Client Name</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs italic">No matching appointments found.</div>
                ) : (
                  filteredAppointments.map((job) => {
                    const assignedFitter = workforceMembers.find(f => f.id === job.team) || (() => {
                      const userObj = allUsers.find(u => u._id === job.team);
                      if (!userObj) return null;
                      const ll = extractLatLng(userObj.location);
                      return {
                        id: userObj._id,
                        name: userObj.name,
                        role: userObj.role === "sales_manager" ? "Sales Manager" : userObj.role,
                        avatar: userObj.avatar,
                        phone: userObj.phone,
                        status: userObj.liveStatus || "Available",
                        location: ll ? [ll.lat, ll.lng] as [number, number] : undefined,
                        lastUpdated: "Not updated",
                        schedule: { yesterday: [], today: [], tomorrow: [], upcoming: [] },
                        capacity: { max: 5, current: 0, remaining: 5 },
                        nextAvailableSlot: "08:00",
                        jobRef: undefined,
                        history: []
                      } as unknown as Fitter;
                    })();
                    const rawJob = jobs.find(item => item._id === job.id);
                    const statusVal = rawJob?.salesmanWorkflowStatus || (rawJob?.status === "completed" ? "completed" : "not_started");
                    
                    const isTravelling = statusVal === "travelling";
                    const isMeasuring = statusVal === "measuring";
                    const isCompleted = statusVal === "completed" || rawJob?.status === "completed";
                    const isPending = !isTravelling && !isMeasuring && !isCompleted;

                    const formatTimeSafe = (dateStr?: string) => {
                      if (!dateStr) return "--";
                      try {
                        return format(parseISO(dateStr), "hh:mm a");
                      } catch {
                        return "--";
                      }
                    };

                    const salesmanPosition = (() => {
                      const liveLoc = liveLocations?.find(loc => loc.userId === assignedFitter?.id);
                      if (liveLoc) return [liveLoc.lat, liveLoc.lng] as [number, number];
                      return assignedFitter?.location;
                    })();

                    const jobLatLng = rawJob?.location?.coordinates && rawJob.location.coordinates.length >= 2
                      ? [rawJob.location.coordinates[1], rawJob.location.coordinates[0]] as [number, number]
                      : null;

                    let distStr = "Not Started";
                    let etaStr = "Not Available";
                    if (salesmanPosition && jobLatLng) {
                      const dist = distanceKm(salesmanPosition, jobLatLng);
                      const eta = Math.max(1, Math.round((dist / 32) * 60));
                      distStr = `${dist.toFixed(dist >= 10 ? 0 : 1)} km`;
                      etaStr = `${eta} min`;
                    }

                    // MEASURING calculations
                    let travelDistStr = "--";
                    let travelTimeStr = "--";
                    if (jobLatLng) {
                      const travelDist = distanceKm([11.2751, 76.2238], jobLatLng);
                      travelDistStr = `${travelDist.toFixed(travelDist >= 10 ? 0 : 1)} km`;
                      if (rawJob?.travelStartedAt && rawJob?.measurementStartedAt) {
                        const diffMs = new Date(rawJob.measurementStartedAt).getTime() - new Date(rawJob.travelStartedAt).getTime();
                        const mins = Math.max(1, Math.round(diffMs / 60000));
                        travelTimeStr = `${mins} min`;
                      } else {
                        travelTimeStr = `${Math.max(1, Math.round((travelDist / 32) * 60))} min`;
                      }
                    }
                    const measuringStartTimeStr = formatTimeSafe(rawJob?.measurementStartedAt);

                    // COMPLETED calculations
                    let totalTravelDistStr = "--";
                    if (jobLatLng) {
                      const travelDist = distanceKm([11.2751, 76.2238], jobLatLng);
                      totalTravelDistStr = `${travelDist.toFixed(travelDist >= 10 ? 0 : 1)} km`;
                    }
                    let totalTravelTimeStr = "--";
                    if (rawJob?.travelStartedAt && rawJob?.measurementStartedAt) {
                      const diffMs = new Date(rawJob.measurementStartedAt).getTime() - new Date(rawJob.travelStartedAt).getTime();
                      const mins = Math.max(1, Math.round(diffMs / 60000));
                      totalTravelTimeStr = `${mins} min`;
                    } else if (jobLatLng) {
                      const travelDist = distanceKm([11.2751, 76.2238], jobLatLng);
                      totalTravelTimeStr = `${Math.max(1, Math.round((travelDist / 32) * 60))} min`;
                    }

                    return (
                      <div
                        key={job.id}
                        onClick={() => {
                          if (job.team) setSelectedMapFitter(job.team);
                          setSelectedJobId(job.id);
                        }}
                        className={cn(
                          "group border border-slate-100 hover:border-slate-200/80 rounded-xl p-4 bg-white hover:bg-slate-50/30 shadow-sm transition-all duration-150 cursor-pointer flex flex-col gap-2.5",
                          selectedJobId === job.id && "ring-1 ring-blue-500 border-blue-500 shadow-md bg-blue-50/10"
                        )}
                      >
                        {/* Header: Customer Name and Status Badge */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-none">
                              {job.jobId || "APP"}
                            </span>
                            <h3 className="text-sm font-bold text-slate-800 mt-1">{job.client}</h3>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            isCompleted ? "bg-emerald-100 text-emerald-800" :
                            isMeasuring ? "bg-blue-100 text-blue-800 animate-pulse" :
                            isTravelling ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            {isCompleted ? "Completed" :
                             isMeasuring ? "Measuring" :
                             isTravelling ? "On The Way" :
                             "Pending"}
                          </span>
                        </div>

                        {/* Customer Address */}
                        <p className="text-xs text-slate-500 leading-normal flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{job.address}</span>
                        </p>

                        {/* Assigned Representative */}
                        <div className="flex items-center justify-between border-t border-b border-slate-100/80 py-2 my-0.5 text-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Representative</span>
                          {assignedFitter ? (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/40 rounded-lg px-2.5 py-1">
                              <Avatar className="h-5 w-5 rounded-full"><AvatarImage src={assignedFitter.avatar} /><AvatarFallback>{getInitials(assignedFitter.name)}</AvatarFallback></Avatar>
                              <span className="font-bold text-slate-700">{assignedFitter.name}</span>
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold">Unassigned</span>
                          )}
                        </div>

                        {/* Operational Details Grid */}
                        <div className="text-[11px] text-slate-600 space-y-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          {isTravelling && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">📍 Salesman Location:</span>
                                <span className="text-slate-800 font-semibold truncate max-w-[200px]">{assignedFitter?.locationLabel || "GPS Active"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">🚗 Distance:</span>
                                <span className="font-bold text-blue-700 font-mono text-xs">{distStr}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">⏱ ETA:</span>
                                <span className="font-bold text-blue-700 font-mono text-xs">{etaStr}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-200/50 pt-1.5 mt-1 text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-wider">🕘 Time Slot:</span>
                                <span className="font-bold text-slate-700">{job.time || "Not specified"}</span>
                              </div>
                            </>
                          )}

                          {isMeasuring && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">🚗 Travel Distance:</span>
                                <span className="font-semibold text-slate-700 font-mono">{travelDistStr}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">⏱ Travel Time:</span>
                                <span className="font-semibold text-slate-700 font-mono">{travelTimeStr}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">📏 Start Time:</span>
                                <span className="font-semibold text-slate-700 font-mono">{measuringStartTimeStr}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-200/50 pt-1.5 mt-1">
                                <span className="text-indigo-500 font-bold uppercase tracking-wider text-[10px]">⏱ Active Duration:</span>
                                <ActiveTimer startTime={rawJob?.measurementStartedAt} />
                              </div>
                            </>
                          )}

                          {isPending && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">🚗 Distance:</span>
                                <span className="text-slate-400 font-medium italic">Not Started</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">⏱ ETA:</span>
                                <span className="text-slate-400 font-medium italic">Not Available</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-200/50 pt-1.5 mt-1 text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-wider">🕘 Time Slot:</span>
                                <span className="font-bold text-slate-700">{job.time || "Not specified"}</span>
                              </div>
                            </>
                          )}

                          {isCompleted && (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">✅ Completed:</span>
                                <span className="font-bold text-emerald-700">{formatTimeSafe(rawJob?.measurementCompletedAt)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">🚗 Total Distance:</span>
                                <span className="font-semibold text-slate-700 font-mono">{totalTravelDistStr}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-medium">⏱ Total Travel Time:</span>
                                <span className="font-semibold text-slate-700 font-mono">{totalTravelTimeStr}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Map */}
            <div className="flex-1 bg-slate-100">
              <AssignmentMap
                fitters={workforceMembers}
                selectedFitterId={selectedMapFitter}
                onSelectFitter={setSelectedMapFitter}
                filterRole="Salesman"
                scheduledJobs={filteredAppointments.map(j => {
                  const rawJob = jobs.find(item => item._id === j.id);
                  const ll = extractLatLng(rawJob?.location as any);
                  return {
                    id: j.id,
                    jobId: j.jobId,
                    client: j.client,
                    address: j.address ?? "",
                    status: j.status ?? "",
                    location: ll ? { lat: ll.lat, lng: ll.lng } : { lat: 10.8505, lng: 76.2711 },
                    assignedSalesmanId: rawJob?.assignedSalesman || rawJob?.assignedTo || ""
                  };
                })}
                hideStatusPanel={true}
              />
            </div>
          </>
        )}

        {/* VIEW 3: UNASSIGNED LEADS VIEW */}
        {activeTab === "leads" && (
          <>
            <div className="w-full xl:w-[480px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl shrink-0">
              <div className="p-6 border-b border-slate-100 shrink-0 space-y-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                    <div className="w-6 h-px bg-amber-600"></div>
                    <span>Assign Leads Queue</span>
                  </div>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">Unassigned <span className="font-semibold text-slate-900">Leads</span></h2>
                </div>

                {/* Pending / Scheduled Toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 gap-0.5 w-full">
                  <button
                    onClick={() => setLeadFilter("pending")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-center",
                      leadFilter === "pending"
                        ? "bg-white text-amber-700 shadow-sm border border-slate-200/30"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setLeadFilter("scheduled")}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-center",
                      leadFilter === "scheduled"
                        ? "bg-white text-amber-700 shadow-sm border border-slate-200/30"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Scheduled
                  </button>
                </div>

                {/* Priority Selection & Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search leads..."
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
                    />
                  </div>
                  <Select value={leadPriorityFilter} onValueChange={setLeadPriorityFilter}>
                    <SelectTrigger className="w-28 h-9 border-slate-200 bg-slate-50 text-xs rounded-xl font-semibold">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scrollable leads queue */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {filteredUnassignedLeads.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs italic">No unassigned leads found.</div>
                ) : (
                  filteredUnassignedLeads.map((job) => {
                    const isSelected = selectedJobId === job.id;
                    
                    // Simple distance based suggested fitter
                    const suggestedFitter = (() => {
                      const available = workforceMembers.filter(f => f.location && f.status === "Available");
                      if (available.length === 0) return null;
                      const sourceJob = jobs.find(item => item._id === job.id);
                      if (!sourceJob || !sourceJob.location?.coordinates) return null;
                      const jobLatLng: [number, number] = [sourceJob.location.coordinates[1], sourceJob.location.coordinates[0]];
                      const mapped = available.map(f => ({
                        fitter: f,
                        dist: distanceKm(f.location!, jobLatLng)
                      }));
                      mapped.sort((a, b) => a.dist - b.dist);
                      return mapped[0];
                    })();

                    const cardRecommendedFitters = isSelected 
                      ? recommendedFitters 
                      : (suggestedFitter ? [{
                          id: suggestedFitter.fitter.id,
                          name: suggestedFitter.fitter.name,
                          dist: suggestedFitter.dist,
                          isFree: true
                        }] : []);

                    return (
                      <JobCard
                        key={job.id}
                        job={{ ...job, recommendedFitters: cardRecommendedFitters }}
                        isSelected={isSelected}
                        onSelect={() => setSelectedJobId(isSelected ? null : job.id)}
                        onAction={(action, payload) => {
                          if (action === "assign") {
                            initiateAssignment(job.id, payload);
                          } else {
                            handleCardAction(action, job.id);
                          }
                        }}
                        showEditDelete={isAuthorized}
                        variant="assignment"
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Map */}
            <div className="flex-1 bg-slate-100">
              <AssignmentMap
                fitters={workforceMembers}
                selectedFitterId={selectedMapFitter}
                onSelectFitter={setSelectedMapFitter}
                filterRole="Salesman"
                unassignedJobs={filteredUnassignedLeads.map(j => {
                  const rawJob = jobs.find(item => item._id === j.id);
                  const ll = extractLatLng(rawJob?.location as any);
                  return {
                    id: j.id,
                    jobId: j.jobId,
                    client: j.client,
                    address: j.address ?? "",
                    location: ll ? { lat: ll.lat, lng: ll.lng } : { lat: 10.8505, lng: 76.2711 }
                  };
                })}
                selectedJob={selectedPendingJobForMap || null}
                hideStatusPanel={true}
              />
            </div>
          </>
        )}

        {/* VIEW 4: MEASURING VIEW */}
        {activeTab === "measuring" && (
          <>
            <div className="w-full xl:w-[480px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl shrink-0">
              <div className="p-6 border-b border-slate-100 shrink-0 bg-white space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                    <div className="w-6 h-px bg-indigo-600"></div>
                    <span>On-Site Client Measurements</span>
                  </div>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">Measuring <span className="font-semibold text-slate-900">Queue</span></h2>
                </div>

                {/* Metrics Stats bar */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-indigo-50 border border-indigo-100/50 rounded-xl p-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Measuring</span>
                    <span className="text-lg font-bold text-indigo-700">
                      {measuringSalesmen.length}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {jobs.filter(j => j.status === "completed" && j.salesmanWorkflowStatus === "completed").length}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Visits</span>
                    <span className="text-lg font-bold text-slate-700">
                      {jobs.filter(j => ["scheduled", "in_progress"].includes(j.status)).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Measuring list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {measuringSalesmen.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs italic">No active measurements in progress right now.</div>
                ) : (
                  measuringSalesmen.map((salesman) => {
                    const activeJob = salesman.schedule.today.find(j => j.id === salesman.jobRef) ??
                                      salesman.schedule.today.find(j => j.status === "In Progress");

                    return (
                      <div
                        key={salesman.id}
                        onClick={() => setSelectedMapFitter(salesman.id)}
                        className={cn(
                          "border border-slate-100 hover:border-slate-200 rounded-xl p-4 bg-white shadow-sm transition-all duration-150 cursor-pointer flex flex-col gap-2",
                          selectedMapFitter === salesman.id && "ring-1 ring-indigo-500 border-indigo-500 bg-indigo-50/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-lg"><AvatarImage src={salesman.avatar} /><AvatarFallback>{getInitials(salesman.name)}</AvatarFallback></Avatar>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 leading-tight">{salesman.name}</h3>
                              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Representative</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full animate-pulse">
                            Measuring
                          </span>
                        </div>

                        {activeJob ? (
                          <div className="mt-1 space-y-2 border-t border-slate-100 pt-2.5">
                            <div className="flex justify-between items-start text-xs">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Client</span>
                                <span className="font-bold text-slate-800">{activeJob.client}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Elapsed Time</span>
                                <ActiveTimer startTime={activeJob.timerStartedAt || new Date().toISOString()} />
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Location</span>
                              <span className="text-xs text-slate-600 leading-snug">{activeJob.address}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400 mt-2">Setting up measurement timer...</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Map */}
            <div className="flex-1 bg-slate-100">
              <AssignmentMap
                fitters={workforceMembers}
                selectedFitterId={selectedMapFitter}
                onSelectFitter={setSelectedMapFitter}
                filterRole="Salesman"
                showOnlyMeasuring={true}
                hideStatusPanel={true}
              />
            </div>
          </>
        )}

        {/* VIEW 5: PERFORMANCE REPORT VIEW (Full Width Dashboard Analytics) */}
        {activeTab === "performance" && (
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
                  <div className="w-6 h-px bg-emerald-600"></div>
                  <span>Operations & Conversion KPIs</span>
                </div>
                <h2 className="text-3xl font-light text-slate-800 tracking-tight">Workforce <span className="font-semibold text-slate-900">Performance</span></h2>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Visits Managed</span>
                <span className="text-3xl font-bold text-slate-800">{performanceMetrics.total}</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Completed Sales</span>
                <span className="text-3xl font-bold text-emerald-600">{performanceMetrics.completed}</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avg Success Rate</span>
                <span className="text-3xl font-bold text-indigo-600">{performanceMetrics.conversionRate}%</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Dispatch Value</span>
                <span className="text-3xl font-bold text-slate-800">₹{performanceMetrics.revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Leaderboard Table & Trends layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Representative Leaderboard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Salesperson</th>
                        <th className="pb-3 text-center font-semibold">Assigned Visits</th>
                        <th className="pb-3 text-center font-semibold">Completed Visits</th>
                        <th className="pb-3 text-center font-semibold">Conversion Rate</th>
                        <th className="pb-3 text-right font-semibold">Est Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {performanceMetrics.salesmanLeaderboard.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/40">
                          <td className="py-3.5 flex items-center gap-2 text-slate-800 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {row.name}
                          </td>
                          <td className="py-3.5 text-center">{row.total}</td>
                          <td className="py-3.5 text-center text-emerald-600 font-bold">{row.completed}</td>
                          <td className="py-3.5 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{row.rate}%</span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-800">₹{row.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SVG Trend chart card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wider">Weekly Conversion Trend</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-6">Last 7 days</p>
                  
                  {/* SVG line chart */}
                  <div className="h-32 w-full flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                      <path
                        d="M 5,30 Q 20,20 35,28 T 65,12 T 95,8"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="5" cy="30" r="2.5" fill="#10b981" />
                      <circle cx="35" cy="28" r="2.5" fill="#10b981" />
                      <circle cx="65" cy="12" r="2.5" fill="#10b981" />
                      <circle cx="95" cy="8" r="2.5" fill="#10b981" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-4">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Weekly Target Achievement</span>
                  <span className="text-emerald-600 font-bold">114% achieved</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent className="sm:max-w-4xl bg-white p-0 overflow-hidden flex flex-col md:flex-row gap-0">
          <div className="bg-slate-50 p-6 border-r border-slate-100 w-full md:w-1/2 flex flex-col">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-light text-slate-900 mb-1">
                {dialogState?.type === "edit" ? "Reschedule" : "Confirm Dispatch"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dialogState?.type === "edit" ? `Moving ${dialogState.jobClient}` : `Assigning ${dialogState?.jobClient}`}
              </DialogDescription>
              <div className="pt-3">
                {dialogState?.requestedDate ? (
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50/80 border border-amber-200/50 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Requested: {dialogState.requestedDate}
                  </div>
                ) : (
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50 border border-slate-200/50 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm">
                    <CalendarDays className="w-3.5 h-3.5" />
                    No Requested Time
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">1. Select Service Date</label>
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    initialFocus
                    className="rounded-md border-0"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">2. Select Salesman</label>
                <Select value={dialogState?.salesmanId ?? "none"} onValueChange={(val) => handleDialogSalesmanChange(val === "none" ? "" : val)}>
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm font-medium text-slate-800">
                    <SelectValue placeholder="Choose Salesman" />
                  </SelectTrigger>
                  <SelectContent className="z-1200 max-h-72">
                    <SelectItem value="none">
                      <span className="text-slate-400">-- None --</span>
                    </SelectItem>
                    {salesmen.map((salesman) => {
                      const activeSchedule = rescheduleDate && isSameDay(rescheduleDate, new Date())
                        ? salesman.schedule.today
                        : rescheduleDate && isSameDay(rescheduleDate, addDays(new Date(), 1))
                          ? salesman.schedule.tomorrow
                          : [];
                      const count = activeSchedule.length;

                      return (
                        <SelectItem key={salesman.id} value={salesman.id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{salesman.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">
                              {count} assigned
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Select a salesman to assign to this job.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 w-full md:w-1/2 flex flex-col">
            <div className="mb-6 flex items-center justify-between pr-6">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">3. Custom Time</label>
              {rescheduleDate && <span className="text-xs font-medium text-slate-900">{format(rescheduleDate, "EEE, MMM do")}</span>}
            </div>

            <div className="flex-1 content-start space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden p-4 bg-slate-50">
                <label htmlFor="customTime" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">Enter Time</label>
                <Input
                  id="customTime"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="h-16 text-3xl font-light text-center bg-white border-slate-200 shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed px-4">
                You can pick any exact time to schedule this job for the salesman.
              </p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 gap-2 flex-wrap sm:flex-nowrap">
              {dialogState?.type === "edit" ? (
                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 h-8 shrink-0" onClick={handleUnassign}>Unassign Job</Button>
              ) : <div className="shrink-0"></div>}
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="ghost" onClick={() => setDialogState(null)}>Cancel</Button>
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" onClick={() => confirmAction(customTime)}>Confirm Dispatch</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl bg-white p-6 rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-800">Update Job Details</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify operational fields for this field-force unit. Changes apply instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Customer Names */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                <Input
                  value={editJobFormState.firstName}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                <Input
                  value={editJobFormState.lastName}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Customer Phone & Estimated Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Phone</label>
                <Input
                  value={editJobFormState.customerPhone}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="Phone Number"
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Value (AED)</label>
                <Input
                  type="number"
                  value={editJobFormState.projectValue}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, projectValue: e.target.value }))}
                  placeholder="Value"
                  className="h-9 text-xs rounded-xl border-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Address & Interactive Map */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area / Location Address <span className="text-red-500">*</span></label>
              <div ref={suggestionsRef} className="relative">
                <Input
                  ref={addressInputRef}
                  id="address"
                  name="address"
                  required
                  placeholder="Search Malappuram or Dubai area, building, landmark..."
                  value={addressValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const capitalized = val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : "";
                    setAddressValue(capitalized);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-9 text-xs rounded-xl border-slate-200 bg-white"
                />
                
                {showSuggestions && (addressValue.trim().length >= 2) && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
                    <div className="border-b border-slate-100 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      Malappuram and Dubai local search
                    </div>
                    {isLoadingSuggestions && (
                      <div className="space-y-1.5 p-2">
                        {[0, 1, 2].map((item) => (
                          <div key={item} className="flex animate-pulse items-center gap-2 rounded-lg p-1.5">
                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="flex-1 space-y-1">
                              <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                              <div className="h-2 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isLoadingSuggestions && suggestions.length === 0 && (
                      <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                        No matches found. Try a local area like Kottakkal, Kottappadi, Deira, or JVC.
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
                        className="group flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2 text-left transition-all last:border-b-0 hover:bg-emerald-50/70 focus:bg-emerald-50 focus:outline-none dark:border-slate-800 dark:hover:bg-emerald-950/20"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <MapPin className="h-3 w-3" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{highlightSuggestionMatch(item.primary, addressValue)}</span>
                            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-slate-500 dark:bg-slate-800">{item.category}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {item.secondary || item.display_name}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="mt-2">
                  <AddressPickerMap onAddressSelect={handleAddressSelect} externalCoords={mapCoords} />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Date</label>
                <Input
                  type="date"
                  value={editJobFormState.scheduledDate}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Time</label>
                <Input
                  type="time"
                  value={editJobFormState.scheduledTime}
                  onChange={(e) => setEditJobFormState(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Assigned Salesman, Status & Priority */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Representative</label>
                <Select
                  value={editJobFormState.assignedSalesman || "unassigned"}
                  onValueChange={(val) => setEditJobFormState(prev => ({ ...prev, assignedSalesman: val === "unassigned" ? "" : val }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesmen.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                <Select
                  value={editJobFormState.priority}
                  onValueChange={(val: any) => setEditJobFormState(prev => ({ ...prev, priority: val }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <Select
                  value={editJobFormState.status}
                  onValueChange={(val: any) => setEditJobFormState(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</label>
              <Textarea
                value={editJobFormState.notes}
                onChange={(e) => setEditJobFormState(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional instructions or notes"
                className="text-xs rounded-xl border-slate-200 resize-none min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 rounded-xl">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Job?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This action cannot be undone and will remove the job from all lists, calendars, and routes.
            </DialogDescription>
          </DialogHeader>

          {deleteJobTarget && (
            <div className="space-y-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Customer:</span>
                  <span className="text-slate-800 font-bold">{deleteJobTarget.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Job ID:</span>
                  <span className="text-slate-800 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {getJobDisplayId(deleteJobTarget)}
                  </span>
                </div>
                {deleteJobTarget.scheduledAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Scheduled:</span>
                    <span className="text-slate-800 font-medium">{format(parseISO(deleteJobTarget.scheduledAt), "MMM d, yyyy 'at' hh:mm a")}</span>
                  </div>
                )}
              </div>

              {/* Safety active warning */}
              {["travelling", "measuring"].includes(deleteJobTarget.salesmanWorkflowStatus || "") || deleteJobTarget.status === "in_progress" ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs flex gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">⚠️ Warning: This job is currently active!</p>
                    <p className="text-[11px] mt-0.5 text-red-700 leading-normal">
                      A salesman is currently {deleteJobTarget.salesmanWorkflowStatus === "travelling" ? "travelling to" : "measuring"} this customer. Deleting it will disrupt their active workflow.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Explicit confirmation checkbox if job is active */}
              {["travelling", "measuring"].includes(deleteJobTarget.salesmanWorkflowStatus || "") || deleteJobTarget.status === "in_progress" ? (
                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="confirmActiveDelete"
                    checked={confirmActiveDelete}
                    onChange={(e) => setConfirmActiveDelete(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="confirmActiveDelete" className="text-xs text-slate-700 font-bold select-none cursor-pointer">
                    I confirm that I want to delete this active job.
                  </label>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={
                !!(deleteJobTarget &&
                (["travelling", "measuring"].includes(deleteJobTarget.salesmanWorkflowStatus || "") || deleteJobTarget.status === "in_progress") &&
                !confirmActiveDelete)
              }
              className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10 rounded-xl"
            >
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
