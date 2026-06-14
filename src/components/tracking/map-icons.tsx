import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { CarFront } from "lucide-react";

export type LiveMarkerStatus = "Available" | "Working" | "On The Way" | "Offline" | "Measuring";
export type LiveMarkerRole = "Salesman" | "Fitter";

export const MARKER_STATUS_CONFIG: Record<LiveMarkerStatus | "Late", { color: string; ringColor: string; label: string }> = {
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
};

interface LiveMarkerIconOptions {
  status: LiveMarkerStatus;
  late: boolean;
  avatarUrl?: string;
  name?: string;
  role?: LiveMarkerRole;
  clusterIndex?: number;
  clusterTotal?: number;
  bearing?: number;
  zoomLevel?: number;
  customerName?: string;
  routeDistanceText?: string;
  routeEtaText?: string;
}

function truncateName(text: string, maxLen: number = 10): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export function createLiveMarkerIcon({
  status,
  late,
  name,
  role,
  clusterIndex = 0,
  clusterTotal = 1,
}: LiveMarkerIconOptions) {
  const activeStatus = late ? "Late" : status;
  const statusConf = MARKER_STATUS_CONFIG[activeStatus];
  const isPulsing = status !== "Offline" || late;
  const accentColor = statusConf.color;

  const nameParts = name?.trim().split(/\s+/) || [];
  let initials = "FT";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length > 0) {
    initials = nameParts[0][0].toUpperCase();
  } else {
    initials = role === "Salesman" ? "SM" : "FT";
  }

  const html = renderToStaticMarkup(
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", zIndex: clusterIndex }}>
      {isPulsing && <div style={{ position: "absolute", bottom: "4px", left: "4px", right: "4px", top: "4px", borderRadius: "50%", backgroundColor: statusConf.ringColor, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", opacity: 0.75 }} />}
      <div style={{ position: "relative", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "white", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: `3.5px solid ${accentColor}` }}>
        <span style={{ color: "#0f172a", fontSize: "15px", fontWeight: 800, letterSpacing: "0.02em" }}>
          {initials}
        </span>
      </div>
    </div>
  );

  let offsetX = 0;
  let offsetY = 0;
  if (clusterTotal > 1) {
    const angle = (clusterIndex / clusterTotal) * Math.PI * 2;
    offsetX = Math.round(Math.cos(angle) * 12);
    offsetY = Math.round(Math.sin(angle) * 12);
  }

  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [48, 48],
    iconAnchor: [24 - offsetX, 24 - offsetY],
    popupAnchor: [offsetX, -24 + offsetY],
    tooltipAnchor: [offsetX, -24 + offsetY],
  });
}

export function createCompanyMarkerIcon() {
  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        width: "66px",
        height: "66px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "66px",
          height: "66px",
          borderRadius: "50%",
          background: "rgba(249, 115, 22, 0.18)",
          boxShadow: "0 0 0 10px rgba(249, 115, 22, 0.08)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "48px",
          height: "48px",
          borderRadius: "16px",
          background: "linear-gradient(145deg, #111827 0%, #020617 100%)",
          border: "3px solid #f97316",
          boxShadow: "0 14px 28px rgba(15,23,42,0.32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 900,
          fontSize: "13px",
          letterSpacing: "-0.04em",
        }}
      >
        EB
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "5px",
          width: "18px",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(15,23,42,0.18)",
          filter: "blur(2px)",
        }}
      />
    </div>,
  );

  return L.divIcon({
    html,
    className: "company-hq-marker",
    iconSize: [66, 66],
    iconAnchor: [33, 33],
    popupAnchor: [0, -28],
  });
}
