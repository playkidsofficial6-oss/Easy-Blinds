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
        <ellipse cx="29" cy="36" rx="21" ry="4" fill="rgba(15,23,42,0.2)" />
        <path d="M8.8 23.7c.5-3.4 2.7-5.8 6.3-6.5l5-6.3c1.1-1.4 2.7-2.1 4.5-2.1h9.3c2.2 0 4.2 1.2 5.2 3.1l2.8 5.2c4.8.8 7.6 3.4 8.1 7.5l.3 2.7c.2 1.7-1.1 3.2-2.8 3.3l-3.1.2c-.7-3.5-3.8-6.1-7.5-6.1-3.8 0-6.9 2.7-7.6 6.3h-8.5c-.7-3.6-3.8-6.3-7.6-6.3-3.6 0-6.7 2.5-7.5 5.9l-1.3-.1c-1.8-.1-3.1-1.7-2.8-3.5l.5-3.3h4.7Z" fill="#f97316" />
        <path d="M10.6 22.6c.9-2.4 2.8-3.8 5.6-4.3l5.4-6.8c.7-.9 1.8-1.4 3-1.4h8.6c1.6 0 3.1.9 3.9 2.3l3 5.6c3.9.5 6.5 2.4 7.5 5.5-12.6-1.8-25.1-1.8-37-.2v-.7Z" fill="url(#googleCarGradient)" />
        <path d="M21.9 13.2h7.3v5.5H17.6l4.3-5.5Z" fill="#7dd3fc" />
        <path d="M31.1 13.2h3c.9 0 1.7.5 2.1 1.3l2.2 4.2h-7.3v-5.5Z" fill="#38bdf8" />
        <path d="M20.5 13.8h8.7v1.4h-9.8l1.1-1.4ZM31.1 13.8h3c.8 0 1.5.5 1.9 1.2l.2.4h-5.1v-1.6Z" fill="rgba(255,255,255,0.62)" />
        <circle cx="13.2" cy="30.9" r="5.7" fill="#111827" />
        <circle cx="13.2" cy="30.9" r="2.9" fill="#e5e7eb" />
        <circle cx="13.2" cy="30.9" r="1.1" fill="#64748b" />
        <circle cx="36.9" cy="30.9" r="5.7" fill="#111827" />
        <circle cx="36.9" cy="30.9" r="2.9" fill="#e5e7eb" />
        <circle cx="36.9" cy="30.9" r="1.1" fill="#64748b" />
        <path d="M8.4 22.6h5.9c.8 0 1.4.6 1.4 1.4v.4H8.4v-1.8Z" fill="#fed7aa" />
        <path d="M45.2 22.6h4.5l.3 1.8h-6.2V24c0-.8.6-1.4 1.4-1.4Z" fill="#fde68a" />
        <circle cx="48.4" cy="17.8" r="2.8" fill="#94a3b8" stroke="white" strokeWidth="1.5" />
        <defs>
          <linearGradient id="googleCarGradient" x1="12" y1="10" x2="42" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb923c" />
            <stop offset="0.55" stopColor="#f97316" />
            <stop offset="1" stopColor="#ea580c" />
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
