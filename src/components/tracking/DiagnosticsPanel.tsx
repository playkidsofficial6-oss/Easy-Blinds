"use client";
import { useEffect, useRef } from "react";
import { getLiveLocationSocket } from "@/services/socket";
export default function DiagnosticsPanel() {
  const packetsOutRef = useRef(0);
  const packetsInRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const socket = getLiveLocationSocket();
      if (socket?.connected) {
        packetsOutRef.current += 1;

        socket.emit("ping", () => {
          packetsInRef.current += 1;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  return (
    <>
    </>
  );
}
