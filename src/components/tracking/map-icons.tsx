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
        <ellipse cx="28.5" cy="35.4" rx="18.6" ry="3.6" fill="rgba(15,23,42,0.22)" />
        <path d="M8.7 25.8c.3-3.8 2.6-6.4 6.6-7.4l5.1-6.5c1.1-1.4 2.8-2.2 4.6-2.2h7.5c2.1 0 4 1.1 5.1 2.9l3.2 5.5c4.6.8 7.8 3.5 8.3 7l.4 2.3c.3 1.6-.9 3.1-2.5 3.2l-3.2.3c-.6-3.1-3.3-5.4-6.6-5.4-3.4 0-6.1 2.5-6.7 5.7H19.9c-.6-3.2-3.3-5.7-6.7-5.7-3.2 0-5.9 2.3-6.6 5.3h-.9c-1.5 0-2.7-1.4-2.5-2.9l.4-2.1h5.1Z" fill="#c2410c" opacity="0.95" />
        <path d="M9.8 24.2c.6-2.8 2.8-4.7 6.4-5.3l5.5-6.9c.8-1 2-1.6 3.3-1.6h7.1c1.5 0 3 .8 3.8 2.2l3.4 6c3.9.6 6.7 2.6 7.5 5.5-12.5-1.9-24.8-1.9-37 .1Z" fill="url(#googleCarPaint)" />
        <path d="M14.2 18.4c1.2-.3 2.6-.5 4.1-.6l3.8-4.8c.6-.8 1.5-1.2 2.5-1.2h3.9v6.8H14.2v-.2Z" fill="#fb923c" />
        <path d="M30 11.8h2.2c1 0 1.9.5 2.5 1.4l3.1 5.4H30v-6.8Z" fill="#ea580c" />
        <path d="M22.5 13.2c.5-.6 1.2-.9 2-.9h4v5.3H18.8l3.7-4.4Z" fill="url(#frontWindow)" />
        <path d="M30.2 12.3h1.8c.8 0 1.5.4 1.9 1.1l2.4 4.2h-6.1v-5.3Z" fill="url(#rearWindow)" />
        <path d="M23.2 13.1h5.2v1.1h-6.1l.9-1.1ZM30.2 13.1H32c.6 0 1.1.3 1.4.8l.3.5h-3.5v-1.3Z" fill="rgba(255,255,255,0.62)" />
        <path d="M11 23.3h5.1c.8 0 1.4.6 1.4 1.4v.3H10.6l.4-1.7Z" fill="#fed7aa" />
        <path d="M43.8 23.3h4.1l.3 1.7h-5.8v-.3c0-.8.6-1.4 1.4-1.4Z" fill="#fde68a" />
        <path d="M18.4 20.3c5.8-.6 12.4-.6 19.5.1" stroke="rgba(154,52,18,0.35)" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="13.4" cy="30.6" r="5.8" fill="#0f172a" />
        <circle cx="13.4" cy="30.6" r="3" fill="#f8fafc" />
        <circle cx="13.4" cy="30.6" r="1.2" fill="#64748b" />
        <circle cx="37.4" cy="30.6" r="5.8" fill="#0f172a" />
        <circle cx="37.4" cy="30.6" r="3" fill="#f8fafc" />
        <circle cx="37.4" cy="30.6" r="1.2" fill="#64748b" />
        <circle cx="48.3" cy="17.8" r="2.8" fill="#94a3b8" stroke="#ffffff" strokeWidth="1.4" />
        <defs>
          <linearGradient id="googleCarPaint" x1="12" y1="10" x2="43" y2="29" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffb15f" />
            <stop offset="0.38" stopColor="#f97316" />
            <stop offset="1" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="frontWindow" x1="19" y1="12" x2="29" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#bfdbfe" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="rearWindow" x1="30" y1="12" x2="37" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93c5fd" />
            <stop offset="1" stopColor="#0ea5e9" />
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
