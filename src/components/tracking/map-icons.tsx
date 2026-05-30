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
  const isMovingSalesman = role === "Salesman";
  const accentColor = statusConf.color;

  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (role === "Salesman" ? "SM" : "FT");

  const displayName = name || (role === "Salesman" ? "Salesman" : "Fitter");
  const statusLabelText = status === "Measuring" ? "MEASURING" :
    status === "Working" ? "IN PROGRESS" :
      status === "On The Way" ? "ON THE WAY" : status.toUpperCase();

  const compact = zoomLevel < 9;

  if (isMovingSalesman) {
    const speedText = status === "On The Way" ? "0" : "0";
    const distanceText = customerName ? "0.0 km" : "0.0 km";
    const confidenceText = status === "Offline" ? "--" : "94%";
    const riskText = late ? "High" : status === "Offline" ? "Off" : "Low";
    const riskColor = late ? "#ef4444" : status === "Offline" ? "#64748b" : "#10b981";
    const statusColor = late ? "#ef4444" : status === "On The Way" ? "#ea7a00" : accentColor;

    const card = (
      <div
        style={{
          position: "relative",
          width: compact ? "116px" : "136px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: compact ? "112px" : "130px",
            background: "rgba(255,255,255,0.96)",
            border: "1px solid rgba(226,232,240,0.95)",
            borderRadius: "18px",
            padding: compact ? "8px" : "10px",
            boxShadow: "0 14px 30px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.08)",
            backdropFilter: "blur(10px)",
            color: "#0f172a",
            fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "7px" }}>
            <div style={{ maxWidth: "72px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: compact ? "11px" : "13px", fontWeight: 900, letterSpacing: "-0.04em", color: "#0f172a" }}>
              {displayName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#10b981", fontWeight: 900, fontSize: compact ? "8px" : "10px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/></svg>
              <svg width="14" height="11" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="2.5" width="21" height="11" rx="2.5" stroke="currentColor" strokeWidth="3"/><path d="M25 6v4" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><rect x="4" y="5" width="14" height="6" rx="1" fill="currentColor"/></svg>
              <span>100%</span>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(226,232,240,0.72)", margin: compact ? "7px 0" : "8px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: statusColor, boxShadow: `0 0 0 5px ${late ? 'rgba(239,68,68,0.12)' : 'rgba(234,122,0,0.12)'}` }} />
              <span style={{ color: statusColor, fontSize: compact ? "11px" : "12px", fontWeight: 950, letterSpacing: "0.04em", lineHeight: 1.2 }}>{statusLabelText}</span>
            </div>
            <div style={{ borderRadius: "8px", background: "#f1f5f9", padding: compact ? "4px 6px" : "5px 7px", minWidth: compact ? "36px" : "42px", textAlign: "center", color: "#64748b", fontWeight: 800, fontSize: compact ? "10px" : "12px", lineHeight: 1.15 }}>
              {speedText}<br /><span style={{ fontSize: compact ? "8px" : "10px", fontWeight: 700 }}>km/h</span>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(226,232,240,0.72)", margin: compact ? "7px 0" : "8px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 8px", color: "#64748b", fontWeight: 800, fontSize: compact ? "9px" : "10.5px" }}>
            <div>ETA 0m</div>
            <div>{distanceText}</div>
            <div style={{ color: "#94a3b8", fontWeight: 700 }}>ETA Confidence:</div>
            <div style={{ color: "#94a3b8", fontWeight: 700 }}>Risk:</div>
            <div style={{ color: "#10b981", fontWeight: 950 }}>{confidenceText}</div>
            <div style={{ color: riskColor, fontWeight: 950 }}>{riskText}</div>
          </div>
        </div>
        <div style={{ position: "relative", marginTop: "-5px" }}>
          {isPulsing && <div style={{ position: "absolute", inset: "-15px", borderRadius: "999px", backgroundColor: statusConf.ringColor, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", opacity: 0.75 }} />}
          <div style={{ width: "32px", height: "32px", borderRadius: "999px", border: "3px solid white", background: statusColor, boxShadow: "0 12px 24px rgba(15,23,42,0.22)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transform: `rotate(${bearing}deg)` }}>
            <CarFront style={{ width: "16px", height: "16px", display: "block" }} />
          </div>
        </div>
      </div>
    );

    const html = renderToStaticMarkup(card);
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
      iconSize: compact ? [116, 158] : [136, 172],
      iconAnchor: [68 - offsetX, 162 - offsetY],
      popupAnchor: [offsetX, -150 + offsetY],
    });
  }

  const statusIcon = status === "Measuring" || status === "Working" ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.82 2.82 0 0 1 0 4c-1 1-2.5 1-3.5 0L2.8 4.3a2.82 2.82 0 0 1 0-4c1-1 2.5-1 3.5 0Z" /><path d="m5.6 7.2 1.4-1.4" /><path d="m7.2 10.4 1.4-1.4" /><path d="m10.4 12 1.4-1.4" /><path d="m12 15.2 1.4-1.4" /><path d="m15.2 16.8 1.4-1.4" /></svg>
  ) : (
    <span>{initials}</span>
  );

  const avatarMarker = (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ background: "rgba(255,255,255,0.96)", color: "#0f172a", fontSize: "10px", fontWeight: 900, letterSpacing: "0.03em", padding: "4px 9px", borderRadius: "999px", boxShadow: "0 8px 18px rgba(15,23,42,0.16)", border: "1px solid rgba(148,163,184,0.35)", whiteSpace: "nowrap", maxWidth: "112px", overflow: "hidden", textOverflow: "ellipsis" }}>
        {displayName.toUpperCase()}
      </div>
      <div style={{ position: "relative", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "white", padding: "2px", boxShadow: "0 10px 22px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `3px solid ${accentColor}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", color: accentColor, fontSize: "12px", fontWeight: 800, letterSpacing: "0.02em" }}>
          {avatarUrl ? <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={name || "User"} /> : statusIcon}
        </div>
        <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "18px", height: "18px", backgroundColor: statusConf.color, border: "2px solid white", borderRadius: "50%", zIndex: 20, boxShadow: "0 2px 5px rgba(15,23,42,0.25)" }} />
      </div>
    </div>
  );

  const html = renderToStaticMarkup(
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "120px", height: "86px", zIndex: clusterIndex }}>
      {isPulsing && <div style={{ position: "absolute", bottom: 0, width: "58px", height: "58px", borderRadius: "50%", backgroundColor: statusConf.ringColor, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", opacity: 0.75 }} />}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>{avatarMarker}</div>
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
