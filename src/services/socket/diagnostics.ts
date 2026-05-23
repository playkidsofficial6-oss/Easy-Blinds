export interface DiagnosticLog {
  timestamp: string;
  type: "GPS" | "SOCKET" | "API" | "MANAGER" | "ERROR";
  message: string;
  data?: any;
}

export interface DiagnosticsStore {
  logs: DiagnosticLog[];
  addLog: (type: DiagnosticLog["type"], message: string, data?: any) => void;
  clear: () => void;
}

const MAX_LOGS = 100;

if (typeof window !== "undefined") {
  const store: DiagnosticsStore = {
    logs: [],
    addLog(type, message, data) {
      const newLog: DiagnosticLog = {
        timestamp: new Date().toISOString(),
        type,
        message,
        data,
      };
      this.logs.unshift(newLog);
      if (this.logs.length > MAX_LOGS) {
        this.logs.pop();
      }
      window.dispatchEvent(new CustomEvent("live-location-diagnostic-log", { detail: newLog }));
    },
    clear() {
      this.logs = [];
      window.dispatchEvent(new CustomEvent("live-location-diagnostic-log"));
    }
  };

  (window as any).__liveLocationDiagnostics = store;
}

export function logDiagnostic(type: DiagnosticLog["type"], message: string, data?: any) {
  if (typeof window !== "undefined") {
    const store = (window as any).__liveLocationDiagnostics as DiagnosticsStore | undefined;
    store?.addLog(type, message, data);
  }
  console.log(`[LiveLocationDiagnostics] [${type}] ${message}`, data ?? "");
}

export function getDiagnosticLogs(): DiagnosticLog[] {
  if (typeof window !== "undefined") {
    const store = (window as any).__liveLocationDiagnostics as DiagnosticsStore | undefined;
    return store?.logs ?? [];
  }
  return [];
}
