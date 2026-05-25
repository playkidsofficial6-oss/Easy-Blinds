"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal, Shield, Wifi, X, Activity, RefreshCw, Trash2, MapPin, Satellite, Radio, Clock } from "lucide-react";
import { getDiagnosticLogs, logDiagnostic } from "@/services/socket";
import type { DiagnosticLog } from "@/services/socket/diagnostics";
import { getLiveLocationSocket } from "@/services/socket";

// Minimal subset of LiveMapMarker needed for the diagnostics display
interface DiagnosticsMarker {
  id: string;
  name: string;
  status: string;
  position: [number, number];
}

interface DiagnosticsPanelProps {
  socketConnected: boolean;
  activeMarkersCount: number;
  markers?: DiagnosticsMarker[];
}

interface SocketStats {
  transport: string;
  pingMs: number | null;
  packetsOut: number;
  packetsIn: number;
  lastPacketAt: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  GPS: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SOCKET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  API: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
  MANAGER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function DiagnosticsPanel({
  socketConnected,
  activeMarkersCount,
  markers = [],
}: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [socketStats, setSocketStats] = useState<SocketStats>({
    transport: "unknown",
    pingMs: null,
    packetsOut: 0,
    packetsIn: 0,
    lastPacketAt: null,
  });
  const packetsOutRef = useRef(0);
  const packetsInRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Live log feed
  useEffect(() => {
    setLogs([...getDiagnosticLogs()]);

    const handleNewLog = () => {
      setLogs([...getDiagnosticLogs()]);
    };

    window.addEventListener("live-location-diagnostic-log", handleNewLog);
    return () => window.removeEventListener("live-location-diagnostic-log", handleNewLog);
  }, []);

  // Socket stats polling
  useEffect(() => {
    const interval = setInterval(() => {
      const socket = getLiveLocationSocket();
      if (socket?.connected) {
        const transport = socket.io.engine?.transport?.name ?? "unknown";
        const start = Date.now();
        packetsOutRef.current += 1;

        socket.emit("ping", () => {
          const ms = Date.now() - start;
          packetsInRef.current += 1;
          setSocketStats({
            transport,
            pingMs: ms,
            packetsOut: packetsOutRef.current,
            packetsIn: packetsInRef.current,
            lastPacketAt: new Date().toLocaleTimeString(),
          });
        });
      } else {
        setSocketStats((prev) => ({
          ...prev,
          transport: "none",
          pingMs: null,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearLogs = useCallback(() => {
    if (typeof window !== "undefined") {
      (window as any).__liveLocationDiagnostics?.clear();
    }
  }, []);

  const testPing = useCallback(() => {
    const socket = getLiveLocationSocket();
    if (socket?.connected) {
      logDiagnostic("SOCKET", "🏓 Manual ping test initiated...");
      const start = Date.now();
      packetsOutRef.current += 1;
      socket.emit("ping", () => {
        const ms = Date.now() - start;
        packetsInRef.current += 1;
        logDiagnostic("SOCKET", `🏓 Pong received in ${ms}ms`);
        setSocketStats((prev) => ({ ...prev, pingMs: ms, lastPacketAt: new Date().toLocaleTimeString() }));
      });
    } else {
      logDiagnostic("ERROR", "❌ Cannot ping: socket is not connected");
    }
  }, []);

  // Get GPS stats from the most recent GPS log entry
  const lastGpsLog = logs.find((l) => l.type === "GPS" && l.data?.lat);
  const lastSocketLog = logs.find((l) => l.type === "SOCKET" && l.message.includes("location:updated"));

  return (
    <>
      {/* Floating toggle button */}
      {/* <button
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Diagnostics Panel"
        className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/95 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-2xl backdrop-blur-md hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
      >
        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
        Diagnostics
        <span
          className={`h-2 w-2 rounded-full transition-colors ${
            socketConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_#22c55e]" : "bg-red-500"
          }`}
        />
      </button> */}

      {/* Panel */}
      {/* {isOpen && (
        <div className="absolute right-4 bottom-16 z-[1000] flex h-[580px] w-[420px] flex-col rounded-2xl border border-slate-800/80 bg-slate-950/96 shadow-2xl backdrop-blur-xl overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wide text-slate-100">System Diagnostics</h3>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">Live GPS &amp; WebSocket Monitor</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            
            <div className="grid grid-cols-2 gap-2 p-3 border-b border-slate-800/60">
              
              <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Satellite className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">GPS (Latest Fix)</span>
                </div>
                {lastGpsLog?.data ? (
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">Latitude</div>
                      <div className="font-mono text-sky-300 font-semibold">{Number(lastGpsLog.data.lat).toFixed(6)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">Longitude</div>
                      <div className="font-mono text-sky-300 font-semibold">{Number(lastGpsLog.data.lng).toFixed(6)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">Accuracy</div>
                      <div className="font-mono text-slate-200 font-semibold">±{lastGpsLog.data.accuracy != null ? `${Number(lastGpsLog.data.accuracy).toFixed(0)}m` : "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">Speed</div>
                      <div className="font-mono text-slate-200">{lastGpsLog.data.speed != null ? `${(Number(lastGpsLog.data.speed) * 3.6).toFixed(1)} km/h` : "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">Heading</div>
                      <div className="font-mono text-slate-200">{lastGpsLog.data.heading != null ? `${Number(lastGpsLog.data.heading).toFixed(0)}°` : "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[8px] uppercase">At</div>
                      <div className="font-mono text-slate-400 text-[9px]">{new Date(lastGpsLog.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 italic">No GPS fix recorded yet</div>
                )}
              </div>

              
              <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Socket.IO</span>
                  <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${socketConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {socketConnected ? "● CONNECTED" : "● OFFLINE"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Latency</div>
                    <div className={`font-mono font-semibold ${socketStats.pingMs != null && socketStats.pingMs < 100 ? "text-emerald-400" : socketStats.pingMs != null && socketStats.pingMs < 300 ? "text-amber-400" : "text-red-400"}`}>
                      {socketStats.pingMs != null ? `${socketStats.pingMs}ms` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Protocol</div>
                    <div className="font-mono text-slate-200 uppercase">{socketStats.transport}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Sent / Recv</div>
                    <div className="font-mono text-slate-200">{socketStats.packetsOut} / {socketStats.packetsIn}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Last Packet</div>
                    <div className="font-mono text-slate-400 text-[9px]">{socketStats.lastPacketAt ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Markers</div>
                    <div className="font-mono text-slate-200">{activeMarkersCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[8px] uppercase">Last Update</div>
                    <div className="font-mono text-slate-400 text-[9px]">
                      {lastSocketLog ? new Date(lastSocketLog.timestamp).toLocaleTimeString() : "—"}
                    </div>
                  </div>
                </div>
              </div>

              
              {markers.length > 0 && (
                <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tracked Markers</span>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {markers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-[9px]">
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">{m.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${m.status === "On The Way" ? "bg-orange-500/10 text-orange-400" : m.status === "Working" ? "bg-blue-500/10 text-blue-400" : m.status === "Available" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>{m.status}</span>
                        <span className="font-mono text-slate-500">{m.position[0].toFixed(4)}, {m.position[1].toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            
            <div className="flex gap-2 px-3 py-2 border-b border-slate-800/60">
              <button
                onClick={testPing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-colors"
              >
                <Activity className="h-3 w-3" /> Ping
              </button>
              <button
                onClick={clearLogs}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 py-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-950/20 hover:border-red-900/30 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Clear Logs
              </button>
            </div>

            
            <div className="flex flex-col-reverse overflow-y-auto p-2 font-mono text-[9.5px] leading-relaxed space-y-1 space-y-reverse max-h-[200px]">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-600 italic select-none text-[10px]">
                  No events recorded yet. Start GPS tracking to see logs.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="border-b border-slate-900/40 pb-1.5 last:border-0">
                    <div className="flex items-start gap-1.5 flex-wrap">
                      <span className="text-slate-600 font-sans text-[8px] shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`border font-bold px-1.5 py-0 rounded-[3px] text-[7.5px] uppercase tracking-wider shrink-0 ${TYPE_COLORS[log.type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {log.type}
                      </span>
                      <span className="text-slate-300 font-sans">{log.message}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
