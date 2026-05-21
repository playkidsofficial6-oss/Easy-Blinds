import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

export type LiveMarkerStatus = "Available" | "Working" | "On The Way" | "Offline";
export type LiveMarkerRole = "Salesman" | "Fitter";

export const MARKER_STATUS_CONFIG: Record<LiveMarkerStatus | "Late", { color: string; ringColor: string; label: string }> = {
  Late: { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.4)", label: "Late" },
  Available: { color: "#16a34a", ringColor: "rgba(22, 163, 74, 0.35)", label: "Available" },
  Working: { color: "#2563eb", ringColor: "rgba(37, 99, 235, 0.35)", label: "In Progress" },
  "On The Way": { color: "#f97316", ringColor: "rgba(249, 115, 22, 0.35)", label: "On The Way" },
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
}

export function createLiveMarkerIcon({
  status,
  late,
  avatarUrl,
  name,
  role,
  clusterIndex = 0,
  clusterTotal = 1,
  bearing = 0,
}: LiveMarkerIconOptions) {
  const activeStatus = late ? "Late" : status;
  const statusConf = MARKER_STATUS_CONFIG[activeStatus];
  const isPulsing = status !== "Offline" || late;
  const isMovingSalesman = role === "Salesman" && status === "On The Way";
  const accentColor = statusConf.color;

  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (role === "Salesman" ? "SM" : "FT");

  const carIcon = (
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "18px 18px 20px 20px",
        background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.24), inset 0 0 0 2px rgba(255,255,255,0.85)",
        border: `3px solid ${accentColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${bearing}deg)`,
        transformOrigin: "center",
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2.7 17.8 8.2c.6.6.9 1.4.9 2.2v6.4c0 .9-.7 1.6-1.6 1.6h-1.2v1.4c0 .8-.6 1.4-1.4 1.4h-5c-.8 0-1.4-.6-1.4-1.4v-1.4H6.9c-.9 0-1.6-.7-1.6-1.6v-6.4c0-.8.3-1.6.9-2.2L12 2.7Z" fill={accentColor} />
        <path d="M9 9.2h6l1.2 3.1H7.8L9 9.2Z" fill="white" opacity="0.9" />
        <path d="M8.2 15.8h1.9M13.9 15.8h1.9" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );

  const avatarMarker = (
    <div
      style={{
        position: "relative",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundColor: "white",
        padding: "2px",
        boxShadow: "0 10px 22px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          border: `3px solid ${accentColor}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: accentColor,
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.02em",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={name || "User"} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "72px",
        height: "72px",
        zIndex: clusterIndex,
      }}
    >
      {isPulsing && (
        <div
          style={{
            position: "absolute",
            width: "58px",
            height: "58px",
            borderRadius: "50%",
            backgroundColor: statusConf.ringColor,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            opacity: 0.75,
          }}
        />
      )}
      {isMovingSalesman ? carIcon : avatarMarker}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          width: "13px",
          height: "13px",
          backgroundColor: statusConf.color,
          border: "2px solid white",
          borderRadius: "50%",
          zIndex: 20,
          boxShadow: "0 2px 5px rgba(15,23,42,0.25)",
        }}
      />
    </div>,
  );

  let offsetX = 0;
  let offsetY = 0;
  if (clusterTotal > 1) {
    const angle = (clusterIndex / clusterTotal) * Math.PI * 2;
    offsetX = Math.round(Math.cos(angle) * 38);
    offsetY = Math.round(Math.sin(angle) * 38);
  }

  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [72, 72],
    iconAnchor: [36 - offsetX, 36 - offsetY],
    popupAnchor: [offsetX, -34 + offsetY],
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
