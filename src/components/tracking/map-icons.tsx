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
        <ellipse cx="29" cy="35.5" rx="20" ry="4" fill="rgba(15,23,42,0.22)" />
        <path d="M5.5 21C5.5 10.9 13.8 5.5 29 5.5S52.5 10.9 52.5 21 44.2 36.5 29 36.5 5.5 31.1 5.5 21Z" fill="#b45309" opacity="0.38" />
        <path d="M6.8 21C6.8 11.4 14.4 6.8 29 6.8S51.2 11.4 51.2 21 43.6 35.2 29 35.2 6.8 30.6 6.8 21Z" fill="url(#topCarPaint)" />
        <path d="M10.6 21c1.6-5.9 6.7-9 18.4-9s16.8 3.1 18.4 9c-1.6 5.9-6.7 9-18.4 9s-16.8-3.1-18.4-9Z" fill="rgba(255,193,7,0.46)" />
        <path d="M8.5 17.5c2-6.2 8.5-9 20.5-9s18.5 2.8 20.5 9c-5.2-2.2-11.9-3.3-20.5-3.3S13.7 15.3 8.5 17.5Z" fill="url(#hoodHighlight)" />
        <path d="M17.1 15.4c2.3-4.1 6.1-6 11.9-6s9.6 1.9 11.9 6c-3.8-.8-7.8-1.2-11.9-1.2s-8.1.4-11.9 1.2Z" fill="#111827" opacity="0.9" />
        <path d="M17.7 26.7c2.4 3.9 6.1 5.8 11.3 5.8s8.9-1.9 11.3-5.8c-3.4.7-7.2 1.1-11.3 1.1s-7.9-.4-11.3-1.1Z" fill="#111827" opacity="0.9" />
        <path d="M20.3 15.1c2.2-2.4 5.1-3.6 8.7-3.6s6.5 1.2 8.7 3.6c-2.8-.4-5.7-.6-8.7-.6s-5.9.2-8.7.6Z" fill="url(#glassTop)" opacity="0.92" />
        <path d="M20.6 26.9c2.1 2.3 4.9 3.4 8.4 3.4s6.3-1.1 8.4-3.4c-2.6.4-5.4.6-8.4.6s-5.8-.2-8.4-.6Z" fill="url(#glassTop)" opacity="0.86" />
        <rect x="26.4" y="17.1" width="5.2" height="7.8" rx="0.9" fill="#fef3c7" opacity="0.72" />
        <rect x="27.5" y="17.8" width="3" height="6.4" rx="0.6" fill="#94a3b8" opacity="0.8" />
        <path d="M10.2 12.7c.7-1.1 1.8-2 3.1-2.8" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.82" />
        <path d="M47.8 12.7c-.7-1.1-1.8-2-3.1-2.8" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.82" />
        <path d="M9.8 28.8c.8 1.1 1.9 2 3.3 2.7" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" opacity="0.72" />
        <path d="M48.2 28.8c-.8 1.1-1.9 2-3.3 2.7" stroke="#991b1b" strokeWidth="2.2" strokeLinecap="round" opacity="0.72" />
        <path d="M13.6 21.2c2.9-1.8 8-2.7 15.4-2.7s12.5.9 15.4 2.7" stroke="rgba(120,53,15,0.25)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15.2 12.4C20.1 10.5 24.7 9.6 29 9.6s8.9.9 13.8 2.8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        <defs>
          <linearGradient id="topCarPaint" x1="8" y1="10" x2="50" y2="33" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde047" />
            <stop offset="0.42" stopColor="#facc15" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="hoodHighlight" x1="8" y1="9" x2="48" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff7ad" />
            <stop offset="1" stopColor="#facc15" />
          </linearGradient>
          <linearGradient id="glassTop" x1="20" y1="12" x2="38" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#64748b" />
            <stop offset="1" stopColor="#020617" />
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
