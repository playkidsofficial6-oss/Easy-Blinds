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
        position: "relative",
        width: "58px",
        height: "42px",
        filter: "drop-shadow(0 7px 8px rgba(15, 23, 42, 0.28))",
        transform: `rotate(${bearing}deg)`,
        transformOrigin: "center",
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="58" height="42" viewBox="0 0 58 42" fill="none" aria-hidden="true">
        <ellipse cx="29" cy="35.8" rx="21" ry="4.2" fill="rgba(15,23,42,0.2)" />
        <path d="M8.2 25.4c.4-4.2 2.8-6.7 7.1-7.5l5.2-6.8c1-1.3 2.5-2 4.1-2h10.1c2 0 3.9 1 5 2.7l3.9 6.1c4.8 1 7.5 3.8 7.8 7.8l.1 1.8c.1 1.7-1.2 3.2-2.9 3.3l-3.8.3c-.5-3.4-3.5-6-7.1-6-3.7 0-6.8 2.7-7.2 6.3H19.1c-.5-3.6-3.5-6.3-7.2-6.3-3.5 0-6.5 2.5-7.1 5.9h-.5c-1.7 0-3-1.6-2.6-3.2l.5-2.4h6Z" fill="#a83d10" />
        <path d="M9.5 24.1c.6-3.3 2.7-5.2 6.4-5.8l5.8-7.2c.8-.9 1.9-1.5 3.1-1.5h9.3c1.5 0 2.9.8 3.7 2.1l4.1 6.5c4 .8 6.4 2.9 7.1 6.2-12.6-2.2-25.8-2.3-39.5-.3Z" fill="url(#toyCarBody)" />
        <path d="M15.4 18.2l6.1-7.1c.8-.9 1.9-1.4 3-1.4h4.2v8.7H15.4v-.2Z" fill="#f97316" />
        <path d="M30.4 9.7h3.6c1.4 0 2.6.7 3.3 1.9l4.1 6.8h-11V9.7Z" fill="#ea580c" />
        <path d="M22.7 12.4c.5-.6 1.3-1 2.1-1h4v6H18.4l4.3-5Z" fill="#60a5fa" />
        <path d="M30.5 11.4h3.2c.8 0 1.6.4 2.1 1.1l2.9 4.9h-8.2v-6Z" fill="#3b82f6" />
        <path d="M23.2 12.3h5.6v1.4h-6.8l1.2-1.4ZM30.5 12.3h3.1c.7 0 1.4.4 1.7 1l.4.7h-5.2v-1.7Z" fill="rgba(255,255,255,0.48)" />
        <path d="M10.5 23.2h5.5c.8 0 1.5.7 1.5 1.5v.5H10l.5-2Z" fill="#fed7aa" />
        <path d="M44.7 23.2h5.3l.2 2h-7v-.5c0-.8.7-1.5 1.5-1.5Z" fill="#fde68a" />
        <path d="M15.8 19.7c8.4-.9 17.1-.7 26.1.4" stroke="rgba(124,45,18,0.32)" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="11.9" cy="31" r="6.3" fill="#111827" />
        <circle cx="11.9" cy="31" r="3.4" fill="#d1d5db" />
        <circle cx="11.9" cy="31" r="1.2" fill="#f8fafc" />
        <circle cx="37.7" cy="31" r="6.3" fill="#111827" />
        <circle cx="37.7" cy="31" r="3.4" fill="#d1d5db" />
        <circle cx="37.7" cy="31" r="1.2" fill="#f8fafc" />
        <ellipse cx="49.2" cy="17.7" rx="2.7" ry="2.3" fill="#94a3b8" stroke="white" strokeWidth="1.3" />
        <defs>
          <linearGradient id="toyCarBody" x1="9" y1="10" x2="48" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff9f5a" />
            <stop offset="0.48" stopColor="#f97316" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
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
        width: isMovingSalesman ? "72px" : "72px",
        height: isMovingSalesman ? "58px" : "72px",
        zIndex: clusterIndex,
      }}
    >
      {isPulsing && (
        <div
          style={{
            position: "absolute",
            width: isMovingSalesman ? "52px" : "58px",
            height: isMovingSalesman ? "38px" : "58px",
            borderRadius: isMovingSalesman ? "999px" : "50%",
            backgroundColor: statusConf.ringColor,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            opacity: 0.75,
          }}
        />
      )}
      <div style={{ position: "absolute", top: isMovingSalesman ? "8px" : "12px" }}>
        {isMovingSalesman ? carIcon : avatarMarker}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: isMovingSalesman ? "15px" : "10px",
          right: isMovingSalesman ? "10px" : "10px",
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
    iconSize: isMovingSalesman ? [72, 58] : [72, 72],
    iconAnchor: isMovingSalesman ? [36 - offsetX, 48 - offsetY] : [36 - offsetX, 36 - offsetY],
    popupAnchor: isMovingSalesman ? [offsetX, -46 + offsetY] : [offsetX, -34 + offsetY],
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
