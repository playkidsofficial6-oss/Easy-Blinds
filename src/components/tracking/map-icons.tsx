import React from "react";

export type LiveMarkerStatus = "Available" | "Working" | "On The Way" | "Offline" | "Measuring";
export type LiveMarkerRole = "Salesman" | "Fitter";

export const MARKER_STATUS_CONFIG: Record<
  LiveMarkerStatus | "Late",
  { color: string; ringColor: string; label: string }
> = {
  Late: { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.4)", label: "Late" },
  Available: { color: "#16a34a", ringColor: "rgba(22, 163, 74, 0.35)", label: "Available" },
  Working: { color: "#2563eb", ringColor: "rgba(37, 99, 235, 0.35)", label: "In Progress" },
  "On The Way": { color: "#f59e0b", ringColor: "rgba(245, 158, 11, 0.35)", label: "On The Way" },
  Measuring: { color: "#2563eb", ringColor: "rgba(37, 99, 235, 0.35)", label: "Measuring" },
  Offline: { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.25)", label: "Offline / Busy" },
};

export const EASYBLINDS_HQ = {
  name: "EasyBlinds HQ",
  address: "Nilambur, Kerala",
  position: [11.2766, 76.2258] as [number, number],
  latLng: { lat: 11.2766, lng: 76.2258 },
};

export interface LiveMarkerIconProps {
  status: LiveMarkerStatus;
  late?: boolean;
  avatarUrl?: string;
  name?: string;
  role?: LiveMarkerRole;
  clusterIndex?: number;
  clusterTotal?: number;
  isSelected?: boolean;
}

export function LiveStaffMarker({
  status,
  late = false,
  name,
  role = "Fitter",
  clusterIndex = 0,
  isSelected = false,
}: LiveMarkerIconProps) {
  const activeStatus = late ? "Late" : status;
  const statusConf = MARKER_STATUS_CONFIG[activeStatus] || MARKER_STATUS_CONFIG.Offline;
  const isPulsing = status !== "Offline" || late;
  const accentColor = statusConf.color;

  const nameParts = name?.trim().split(/\s+/) || [];
  let initials = "FT";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length > 0) {
    initials = nameParts[0].toUpperCase();
  } else {
    initials = role === "Salesman" ? "SM" : "FT";
  }

  return (
    <div
      className={`relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
        isSelected ? "scale-110 z-50" : "hover:scale-105"
      }`}
      style={{
        width: "48px",
        height: "48px",
        zIndex: clusterIndex + (isSelected ? 100 : 10),
      }}
    >
      {isPulsing && (
        <div
          className="absolute inset-1 rounded-full animate-ping opacity-75 pointer-events-none"
          style={{ backgroundColor: statusConf.ringColor }}
        />
      )}
      <div
        className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all"
        style={{
          border: `3.5px solid ${accentColor}`,
          boxShadow: isSelected
            ? `0 0 0 4px ${statusConf.ringColor}, 0 8px 16px rgba(15, 23, 42, 0.25)`
            : "0 4px 12px rgba(15, 23, 42, 0.15)",
        }}
      >
        <span className="text-slate-900 text-[13px] font-extrabold tracking-tight">
          {initials}
        </span>
      </div>
      {/* Role tag pill */}
      <div
        className="absolute -bottom-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        {role === "Salesman" ? "SALES" : "FIT"}
      </div>
    </div>
  );
}

export function CompanyHqMarker({ isSelected = false }: { isSelected?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
        isSelected ? "scale-115 z-50" : "hover:scale-105"
      }`}
      style={{ width: "56px", height: "56px" }}
    >
      <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-pulse pointer-events-none" />
      <div className="relative w-11 h-11 rounded-2xl bg-linear-to-br from-slate-900 to-slate-950 border-2 border-orange-500 shadow-xl flex items-center justify-center text-white font-black text-xs tracking-tighter">
        EB
      </div>
      <div className="absolute -bottom-1 bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-widest shadow-sm">
        HQ
      </div>
    </div>
  );
}
