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

  const displayName = (name || (role === "Salesman" ? "Salesman" : "Fitter")).toUpperCase();

  const carIcon = (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {/* Name label above car */}
      <div
        style={{
          background: "white",
          color: "#1e293b",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "3px 8px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
          whiteSpace: "nowrap",
          border: "1px solid rgba(15,23,42,0.06)",
          lineHeight: "1.4",
        }}
      >
        {displayName}
      </div>
      {/* Car image */}
      <div
        style={{
          position: "relative",
          width: "54px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(${bearing}deg)`,
          transformOrigin: "center",
          transition: "transform 280ms ease-out, filter 280ms ease-out",
          filter: "drop-shadow(0 10px 12px rgba(15, 23, 42, 0.28)) drop-shadow(0 0 9px rgba(250, 204, 21, 0.32))",
        }}
      >
        <style>
          {`@keyframes salesmanCarMarkerGlow { 0%, 100% { filter: drop-shadow(0 10px 12px rgba(15, 23, 42, 0.28)) drop-shadow(0 0 7px rgba(250, 204, 21, 0.22)); } 50% { filter: drop-shadow(0 12px 14px rgba(15, 23, 42, 0.32)) drop-shadow(0 0 13px rgba(250, 204, 21, 0.5)); } }`}
        </style>
        <div
          style={{
            position: "absolute",
            bottom: "-5px",
            width: "44px",
            height: "8px",
            borderRadius: "999px",
            background: "rgba(15,23,42,0.22)",
            filter: "blur(4px)",
            transform: "rotate(0deg)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/salesman-car-marker.png"
          alt="Moving salesman"
          style={{
            position: "relative",
            width: "52px",
            height: "auto",
            display: "block",
            objectFit: "contain",
            animation: "salesmanCarMarkerGlow 1.8s ease-in-out infinite",
            transition: "transform 280ms ease-out, filter 280ms ease-out",
          }}
        />
      </div>
    </div>
  );

  const avatarMarker = (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {/* Name label above icon */}
      <div
        style={{
          background: "white",
          color: "#1e293b",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          padding: "3px 8px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
          whiteSpace: "nowrap",
          border: "1px solid rgba(15,23,42,0.06)",
          lineHeight: "1.4",
        }}
      >
        {displayName}
      </div>
      {/* Circle avatar icon */}
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
        {/* Status dot — positioned inside the circle, bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "1px",
            right: "1px",
            width: "13px",
            height: "13px",
            backgroundColor: statusConf.color,
            border: "2px solid white",
            borderRadius: "50%",
            zIndex: 20,
            boxShadow: "0 2px 5px rgba(15,23,42,0.25)",
          }}
        />
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
        width: isMovingSalesman ? "120px" : "120px",
        height: isMovingSalesman ? "86px" : "86px",
        zIndex: clusterIndex,
      }}
    >
      {isPulsing && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: isMovingSalesman ? "60px" : "58px",
            height: isMovingSalesman ? "60px" : "58px",
            borderRadius: "50%",
            backgroundColor: statusConf.ringColor,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            opacity: 0.75,
          }}
        />
      )}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {isMovingSalesman ? carIcon : avatarMarker}
      </div>

    </div>,
  );

  let offsetX = 0;
  let offsetY = 0;
  if (clusterTotal > 1) {
    const angle = (clusterIndex / clusterTotal) * Math.PI * 2;
    offsetX = Math.round(Math.cos(angle) * 38);
    offsetY = Math.round(Math.sin(angle) * 38);
  }

  if (isMovingSalesman) {
    // 120×86: label (~22px) + gap (4px) + car (~30px) + padding = 86
    // Anchor at center of the car image
    return L.divIcon({
      html,
      className: "custom-map-marker",
      iconSize: [120, 86],
      iconAnchor: [60 - offsetX, 62 - offsetY],
      popupAnchor: [offsetX, -62 + offsetY],
    });
  }

  // 120×86: name label (~22px) + gap (4px) + avatar (48px) + padding (12px) = 86
  // Anchor at center of the avatar circle (bottom portion)
  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [120, 86],
    iconAnchor: [60 - offsetX, 74 - offsetY],
    popupAnchor: [offsetX, -74 + offsetY],
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
