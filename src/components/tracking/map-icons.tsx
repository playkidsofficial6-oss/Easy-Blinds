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
}

function truncateName(text: string, maxLen: number = 10): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
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
  zoomLevel = 11,
  customerName,
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

  const statusEmoji = status === "On The Way" ? "🚗" :
    status === "Measuring" || status === "Working" ? "📏" :
      status === "Available" ? "🟢" : "🔴";

  const statusLabelText = status === "Measuring" ? "MEASURING" :
    status === "Working" ? "IN PROGRESS" :
      status === "On The Way" ? "ON THE WAY" : status.toUpperCase();

  const showCustomer = customerName && (status === "On The Way" || status === "Measuring" || status === "Working");
  const truncatedCustomer = showCustomer ? truncateName(customerName!.toUpperCase(), 10) : "";
  const line1Text = showCustomer ? `${displayName} → ${truncatedCustomer}` : displayName;

  const nameCard = zoomLevel >= 10 ? (
    <div
      style={{
        background: "white",
        color: "#1e293b",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        padding: "4px 8px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
        border: "1px solid rgba(15,23,42,0.06)",
        lineHeight: "1.3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ color: "#0f172a", fontWeight: 800, fontSize: "10px" }}>
        {line1Text}
      </div>
      <div style={{ color: accentColor, fontSize: "8.5px", marginTop: "2px", display: "flex", alignItems: "center", gap: "2.5px" }}>
        <span>{statusEmoji}</span>
        <span>{statusLabelText}</span>
      </div>
    </div>
  ) : null;

  const statusIcon = status === "Measuring" ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" /><path d="m5.6 7.2 1.4-1.4" /><path d="m7.2 10.4 1.4-1.4" /><path d="m10.4 12 1.4-1.4" /><path d="m12 15.2 1.4-1.4" /><path d="m15.2 16.8 1.4-1.4" /></svg>
  ) : status === "Working" ? (
    role === "Salesman" ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" /><path d="m5.6 7.2 1.4-1.4" /><path d="m7.2 10.4 1.4-1.4" /><path d="m10.4 12 1.4-1.4" /><path d="m12 15.2 1.4-1.4" /><path d="m15.2 16.8 1.4-1.4" /></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
    )
  ) : status === "Available" ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  ) : status === "Offline" ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  ) : null;

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
      {nameCard}
      {/* Circle wrapper — same structure as avatarMarker */}
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
        <style>
          {`@keyframes salesmanCarMarkerGlow { 0%, 100% { filter: drop-shadow(0 10px 12px rgba(15, 23, 42, 0.28)) drop-shadow(0 0 7px rgba(250, 204, 21, 0.22)); } 50% { filter: drop-shadow(0 12px 14px rgba(15, 23, 42, 0.32)) drop-shadow(0 0 13px rgba(250, 204, 21, 0.5)); } }`}
        </style>
        {/* Inner coloured ring */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `3px solid ${accentColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            color: accentColor,
            animation: "salesmanCarMarkerGlow 1.8s ease-in-out infinite",
            transition: "filter 280ms ease-out",
          }}
        >
          <CarFront style={{ width: "24px", height: "24px", display: "block" }} />
        </div>
        {/* Status badge — bottom-right, same as avatarMarker */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-2px",
            width: "18px",
            height: "18px",
            backgroundColor: statusConf.color,
            border: "2px solid white",
            borderRadius: "50%",
            zIndex: 20,
            boxShadow: "0 2px 5px rgba(15,23,42,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {statusIcon}
        </div>
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
      {nameCard}
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
          ) : status === "Measuring" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" /><path d="m5.6 7.2 1.4-1.4" /><path d="m7.2 10.4 1.4-1.4" /><path d="m10.4 12 1.4-1.4" /><path d="m12 15.2 1.4-1.4" /><path d="m15.2 16.8 1.4-1.4" /></svg>
          ) : status === "Working" ? (
            role === "Salesman" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" /><path d="m5.6 7.2 1.4-1.4" /><path d="m7.2 10.4 1.4-1.4" /><path d="m10.4 12 1.4-1.4" /><path d="m12 15.2 1.4-1.4" /><path d="m15.2 16.8 1.4-1.4" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            )
          ) : (
            <span>{initials}</span>
          )}
        </div>
        {/* Status badge — positioned inside the circle, bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-2px",
            width: "18px",
            height: "18px",
            backgroundColor: statusConf.color,
            border: "2px solid white",
            borderRadius: "50%",
            zIndex: 20,
            boxShadow: "0 2px 5px rgba(15,23,42,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {statusIcon}
        </div>
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
