"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Phone,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Compass,
  Navigation,
  RefreshCw,
  Search,
  Filter,
  X,
  Building,
  ShieldAlert,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLiveLocation } from "@/hooks";
import { getUsers, UserRecord, extractLatLng } from "@/lib/users";
import { isSalesmanRole, isFieldRole, isFitterRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

const EASYBLINDS_HQ: [number, number] = [11.2766, 76.2258];

interface CombinedStaffMember {
  id: string;
  name: string;
  role: "Salesman" | "Fitter";
  phone?: string;
  email?: string;
  checkedIn: boolean;
  lat: number;
  lng: number;
  lastUpdated?: string;
  isLiveLocation: boolean;
}

// ── CUSTOM MARKER ICON CREATOR (GREEN FOR ONLINE, RED FOR OFFLINE) ──
function createCombinedMarkerIcon(member: CombinedStaffMember, isSelected = false) {
  const isSalesman = member.role === "Salesman";
  const isOnline = member.checkedIn;

  // Exact Status Colors:
  // ONLINE  => GREEN (#16a34a) border ring & soft green halo ring
  // OFFLINE => RED (#ef4444) border ring & soft red halo ring
  const ringColor = isOnline ? "#16a34a" : "#ef4444";
  const ringBgColor = isOnline ? "rgba(22, 163, 74, 0.22)" : "rgba(239, 68, 68, 0.25)";

  const nameParts = member.name.trim().split(/\s+/);
  let initials = isSalesman ? "SM" : "FT";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length > 0) {
    initials = nameParts[0].slice(0, 2).toUpperCase();
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "52px",
        transform: isSelected ? "scale(1.18)" : "scale(1)",
        transition: "transform 0.2s ease-in-out",
      }}
    >
      {/* Translucent Halo Ring (Green when online, Red pulse when offline) */}
      <div
        style={{
          position: "absolute",
          inset: "2px",
          borderRadius: "50%",
          backgroundColor: ringBgColor,
          animation: !isOnline ? "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
        }}
      />

      {/* Main Inner Circle with Solid Border Ring */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `3.5px solid ${ringColor}`,
        }}
      >
        <span
          style={{
            color: "#0f172a",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.01em",
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: "custom-fleet-marker",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
}

// HQ Company Icon
function createCompanyHqIcon() {
  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        width: "56px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "44px",
          height: "44px",
          borderRadius: "14px",
          background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
          border: "3px solid #f97316",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: "13px",
        }}
      >
        EB
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: "company-hq-icon",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28],
  });
}

// Helper to center map view
function MapRecenterController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Helper to invalidate and recalculate Leaflet map size on Fullscreen toggle or Window resize
function LeafletMapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const triggerInvalidate = () => {
      map.invalidateSize();
    };

    // Trigger immediately & at staggered timeouts to handle DOM layout changes
    triggerInvalidate();
    const t1 = setTimeout(triggerInvalidate, 50);
    const t2 = setTimeout(triggerInvalidate, 150);
    const t3 = setTimeout(triggerInvalidate, 350);

    window.addEventListener("resize", triggerInvalidate);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", triggerInvalidate);
    };
  }, [isFullscreen, map]);

  return null;
}

export function AdminFleetMap() {
  const { locations, reload: reloadSocketLocations } = useLiveLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedMember, setSelectedMember] = useState<CombinedStaffMember | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<"ALL" | "Salesman" | "Fitter">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Handle Esc key for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Load initial Users data
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load staff users for fleet map", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Combine REST Users data + Live Socket Location data
  const combinedMembers: CombinedStaffMember[] = useMemo(() => {
    const liveMapByUserId = new Map(locations.map((loc) => [loc.userId, loc]));

    return users
      .filter((u) => isSalesmanRole(u.role) || isFieldRole(u.role) || isFitterRole(u.role))
      .map((u) => {
        const liveLoc = liveMapByUserId.get(u._id);
        const isSalesman = isSalesmanRole(u.role) || isFieldRole(u.role);
        const role: "Salesman" | "Fitter" = isSalesman ? "Salesman" : "Fitter";

        // Determine Lat/Lng
        let lat = EASYBLINDS_HQ[0];
        let lng = EASYBLINDS_HQ[1];
        let isLiveLocation = false;
        let lastUpdated: string | undefined = u.updatedAt;

        if (liveLoc) {
          lat = liveLoc.lat;
          lng = liveLoc.lng;
          isLiveLocation = true;
          lastUpdated = liveLoc.updatedAt;
        } else if (u.location) {
          const coords = extractLatLng(u.location);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            lastUpdated = u.location.updatedAt ? String(u.location.updatedAt) : u.updatedAt;
          }
        }

        // Add small offset if coordinates overlap HQ exactly
        const isHqDefault = Math.abs(lat - EASYBLINDS_HQ[0]) < 0.0001 && Math.abs(lng - EASYBLINDS_HQ[1]) < 0.0001;
        if (isHqDefault) {
          // Tiny deterministic jitter based on user ID
          const hash = u._id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          lat += ((hash % 10) - 5) * 0.0015;
          lng += (((hash * 3) % 10) - 5) * 0.0015;
        }

        return {
          id: u._id,
          name: u.name,
          role,
          phone: u.phone,
          email: u.email,
          checkedIn: Boolean(u.checkedIn),
          lat,
          lng,
          lastUpdated,
          isLiveLocation,
        };
      });
  }, [users, locations]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return combinedMembers.filter((m) => {
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
      if (statusFilter === "ONLINE" && !m.checkedIn) return false;
      if (statusFilter === "OFFLINE" && m.checkedIn) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.phone && m.phone.toLowerCase().includes(q)) ||
          m.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedMembers, roleFilter, statusFilter, searchQuery]);

  // Counts summary
  const counts = useMemo(() => {
    const total = combinedMembers.length;
    const salesmen = combinedMembers.filter((m) => m.role === "Salesman").length;
    const fitters = combinedMembers.filter((m) => m.role === "Fitter").length;
    const online = combinedMembers.filter((m) => m.checkedIn).length;
    const offline = combinedMembers.filter((m) => !m.checkedIn).length;
    return { total, salesmen, fitters, online, offline };
  }, [combinedMembers]);

  const handleSelectMember = (member: CombinedStaffMember) => {
    setSelectedMember(member);
    setMapCenter([member.lat, member.lng]);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-slate-950 overflow-hidden shadow-2xl transition-all duration-200",
        isFullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen rounded-none border-none"
          : "w-full h-full rounded-2xl border border-slate-800"
      )}
    >
      {/* ── TOP CONTROL BAR ── */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-[400] flex flex-col gap-2 sm:gap-3 pointer-events-none">
        {/* Filter Pills — horizontal scroll on mobile, wraps on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <Button
            size="sm"
            variant={roleFilter === "ALL" && statusFilter === "ALL" ? "default" : "ghost"}
            onClick={() => {
              setRoleFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 whitespace-nowrap shrink-0"
          >
            All ({counts.total})
          </Button>

          <Button
            size="sm"
            variant={roleFilter === "Salesman" ? "default" : "ghost"}
            onClick={() => setRoleFilter(roleFilter === "Salesman" ? "ALL" : "Salesman")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 transition-colors whitespace-nowrap shrink-0",
              roleFilter === "Salesman" ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-blue-400 hover:bg-blue-950/40"
            )}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500 mr-1" />
            Sales ({counts.salesmen})
          </Button>

          <Button
            size="sm"
            variant={roleFilter === "Fitter" ? "default" : "ghost"}
            onClick={() => setRoleFilter(roleFilter === "Fitter" ? "ALL" : "Fitter")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 transition-colors whitespace-nowrap shrink-0",
              roleFilter === "Fitter" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-400 hover:bg-emerald-950/40"
            )}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 mr-1" />
            Fitters ({counts.fitters})
          </Button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1 shrink-0" />

          {/* Online / Offline Filter Pills */}
          <Button
            size="sm"
            variant={statusFilter === "ONLINE" ? "default" : "ghost"}
            onClick={() => setStatusFilter(statusFilter === "ONLINE" ? "ALL" : "ONLINE")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 whitespace-nowrap shrink-0",
              statusFilter === "ONLINE" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:bg-emerald-950/40"
            )}
          >
            <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
            On ({counts.online})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "OFFLINE" ? "default" : "ghost"}
            onClick={() => setStatusFilter(statusFilter === "OFFLINE" ? "ALL" : "OFFLINE")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 border border-red-500/30 whitespace-nowrap shrink-0",
              statusFilter === "OFFLINE" ? "bg-red-600 text-white" : "text-red-400 hover:bg-red-950/40"
            )}
          >
            <XCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 text-red-500" />
            Off ({counts.offline})
          </Button>
        </div>

        {/* Search & Actions — compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 sm:left-3 top-2 sm:top-2.5 text-slate-400" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 sm:h-8 pl-7 sm:pl-8 pr-7 text-[11px] sm:text-xs bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 sm:top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadUsers();
              reloadSocketLocations();
            }}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Refresh positions"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setMapCenter(EASYBLINDS_HQ)}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Center HQ"
          >
            <Building className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline ml-1">HQ</span>
          </Button>

          {/* ── FULL SCREEN TOGGLE BUTTON ── */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:mr-1.5 text-blue-400" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <MapContainer
        center={EASYBLINDS_HQ}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-0 bg-slate-950"
      >
        <MapRecenterController center={mapCenter} />
        <LeafletMapResizer isFullscreen={isFullscreen} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Company HQ Marker */}
        <Marker position={EASYBLINDS_HQ} icon={createCompanyHqIcon()}>
          <Popup className="custom-popup">
            <div className="p-2 text-slate-900 font-sans">
              <h4 className="font-bold text-sm text-slate-900">EasyBlinds HQ</h4>
              <p className="text-xs text-slate-500">Nilambur, Kerala</p>
            </div>
          </Popup>
        </Marker>

        {/* Combined Fleet Markers */}
        {filteredMembers.map((member) => {
          const isSelected = selectedMember?.id === member.id;
          const icon = createCombinedMarkerIcon(member, isSelected);

          return (
            <Marker
              key={member.id}
              position={[member.lat, member.lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleSelectMember(member),
              }}
            >
              <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                <div className="font-semibold text-xs py-0.5">
                  {member.name}
                  <span className="ml-2 font-bold">({member.role})</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── SELECTED MEMBER DETAILS DRAWER CARD ── */}
      {selectedMember && (
        <div className="absolute bottom-3 sm:bottom-6 left-2 right-2 sm:left-auto sm:right-6 sm:w-[380px] z-[450] animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
          <Card className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardContent className="p-3 sm:p-5 relative">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
                {/* Avatar with Ring */}
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg text-slate-900 bg-white shadow-md border-[3px] sm:border-4",
                    selectedMember.checkedIn
                      ? "border-emerald-600 ring-[3px] sm:ring-4 ring-emerald-500/20"
                      : "border-red-500 ring-[3px] sm:ring-4 ring-red-500/30"
                  )}
                >
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">{selectedMember.name}</h3>
                    <Badge
                      className={cn(
                        "text-[9px] sm:text-[10px] uppercase font-extrabold px-1.5 sm:px-2 py-0.5 shrink-0",
                        selectedMember.role === "Salesman"
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-emerald-600 text-white border-emerald-500"
                      )}
                    >
                      {selectedMember.role}
                    </Badge>
                  </div>


                </div>
              </div>

              {/* Coordinates & Phone */}
              <div className="space-y-1.5 sm:space-y-2 bg-slate-950/60 p-2 sm:p-3 rounded-xl border border-slate-800 text-[10px] sm:text-xs mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-slate-300 gap-2">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                    Coordinates:
                  </span>
                  <span className="font-mono text-white font-semibold text-[10px] sm:text-xs truncate">
                    {selectedMember.lat.toFixed(4)}, {selectedMember.lng.toFixed(4)}
                  </span>
                </div>

                {selectedMember.phone && (
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                      Phone:
                    </span>
                    <a
                      href={`tel:${selectedMember.phone}`}
                      className="text-blue-400 font-medium hover:underline flex items-center gap-1 truncate"
                    >
                      <Phone className="w-3 h-3 shrink-0" /> {selectedMember.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-300 gap-2">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                    Updated:
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    {selectedMember.lastUpdated
                      ? format(parseISO(selectedMember.lastUpdated), "MMM d, HH:mm")
                      : "Recently"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setMapCenter([selectedMember.lat, selectedMember.lng])}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1" /> Recenter
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setSelectedMember(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
