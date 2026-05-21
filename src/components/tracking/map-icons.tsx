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
        width: "78px",
        height: "54px",
        filter: "drop-shadow(0 13px 16px rgba(15, 23, 42, 0.28))",
        transform: `rotate(${bearing}deg)`,
        transformOrigin: "center",
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="78" height="54" viewBox="0 0 78 54" fill="none" aria-hidden="true">
        <ellipse cx="39" cy="46" rx="30" ry="5" fill="rgba(15,23,42,0.22)" />
        <path d="M12.8 31.4c.7-5.2 4.1-9 9.4-10.1l7.1-9.2c1.6-2.1 4.1-3.3 6.8-3.3h13.5c3.3 0 6.4 1.8 8 4.7l4 7.2c5.9 1.3 9.7 5.5 10 11.1l.2 4.2c.1 2.5-1.8 4.7-4.3 4.9l-4.8.4c-1-4.7-5.2-8.2-10.2-8.2-5.1 0-9.3 3.6-10.3 8.4H31.9c-1-4.8-5.2-8.4-10.3-8.4-5 0-9.2 3.5-10.2 8.2l-2.2-.2c-2.6-.2-4.5-2.5-4.1-5.1l.7-4.6h7Z" fill="#f97316" />
        <path d="M14.2 30.6c1-3.8 3.8-6.2 8.4-7.1l7.9-10.1c1.2-1.5 3-2.4 4.9-2.4h13.1c2.5 0 4.8 1.4 6 3.6l4.4 8.1c5.6.8 9.4 4.2 10.2 8.9l.2 1.2c-8.8-1.2-17.8-1.7-27-1.7-9.6 0-19 .5-28.1 1.6v-2.1Z" fill="url(#carBodyGradient)" />
        <path d="M31.5 15.2h9.1v8.6H25.2l6.3-8.6Z" fill="#93c5fd" />
        <path d="M43.5 15.2h5.4c1.4 0 2.7.8 3.4 2l3.6 6.6H43.5v-8.6Z" fill="#60a5fa" />
        <path d="M29.8 15.8h10.8v2.1H28.3l1.5-2.1ZM43.5 15.8h5.3c1.3 0 2.5.8 3 1.9l.5 1H43.5v-2.9Z" fill="rgba(255,255,255,0.45)" />
        <path d="M12.5 31.7h7.7c1.2 0 2.2 1 2.2 2.2v.3h-9.9v-2.5Z" fill="#fed7aa" />
        <path d="M64.7 31.8h5.9l.2 2.5h-8.3v-.3c0-1.2 1-2.2 2.2-2.2Z" fill="#fde68a" />
        <path d="M24.3 25.7h33.2" stroke="rgba(154,52,18,0.35)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M41.7 13.2v18.2" stroke="rgba(154,52,18,0.32)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="21.6" cy="41.4" r="8.2" fill="#111827" />
        <circle cx="21.6" cy="41.4" r="4.1" fill="#9ca3af" />
        <circle cx="21.6" cy="41.4" r="1.8" fill="#f8fafc" />
        <circle cx="52.6" cy="41.4" r="8.2" fill="#111827" />
        <circle cx="52.6" cy="41.4" r="4.1" fill="#9ca3af" />
        <circle cx="52.6" cy="41.4" r="1.8" fill="#f8fafc" />
        <path d="M17.9 20.8c2.1-.9 4.5-1.5 7.4-1.8" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="carBodyGradient" x1="17" y1="12" x2="63" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb923c" />
            <stop offset="0.55" stopColor="#f97316" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          right: "8px",
          top: "11px",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: accentColor,
          border: "2px solid white",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.28)",
        }}
      />
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
        width: isMovingSalesman ? "96px" : "72px",
        height: isMovingSalesman ? "92px" : "72px",
        zIndex: clusterIndex,
      }}
    >
      {isMovingSalesman && name && (
        <div
          style={{
            position: "absolute",
            top: "0px",
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "92px",
            padding: "3px 8px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.96)",
            color: "#111827",
            fontSize: "11px",
            fontWeight: 800,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxShadow: "0 5px 12px rgba(15, 23, 42, 0.2)",
            border: `1px solid ${accentColor}`,
            zIndex: 30,
          }}
        >
          {name}
        </div>
      )}
      {isPulsing && (
        <div
          style={{
            position: "absolute",
            width: isMovingSalesman ? "76px" : "58px",
            height: isMovingSalesman ? "54px" : "58px",
            borderRadius: isMovingSalesman ? "999px" : "50%",
            backgroundColor: statusConf.ringColor,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            opacity: 0.75,
          }}
        />
      )}
      <div style={{ position: "absolute", top: isMovingSalesman ? "34px" : "12px" }}>
        {isMovingSalesman ? carIcon : avatarMarker}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: isMovingSalesman ? "16px" : "10px",
          right: isMovingSalesman ? "14px" : "10px",
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
    iconSize: isMovingSalesman ? [96, 92] : [72, 72],
    iconAnchor: isMovingSalesman ? [48 - offsetX, 72 - offsetY] : [36 - offsetX, 36 - offsetY],
    popupAnchor: isMovingSalesman ? [offsetX, -64 + offsetY] : [offsetX, -34 + offsetY],
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
