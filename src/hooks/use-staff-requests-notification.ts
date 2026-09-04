"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getStaffRequestsUnreadCount, markStaffRequestsSeen } from "@/lib/jobs";

const REFETCH_INTERVAL_MS = 5000; // 5 seconds
const STAFF_REQUESTS_SYNC_EVENT = "measurepro:staff-requests-sync";

export function useStaffRequestsNotification() {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isFetchingRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await getStaffRequestsUnreadCount();
      setUnreadCount(res.unreadCount || 0);
      setTotalPending(res.totalPending || 0);
    } catch (err) {
      // Silently fail on polling errors to avoid disruption
      console.warn("Failed to fetch staff requests unread count:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const markAsSeen = useCallback(async () => {
    // Optimistically zero out unread count
    setUnreadCount(0);
    try {
      await markStaffRequestsSeen();
      // Notify other components/tabs if any
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(STAFF_REQUESTS_SYNC_EVENT, { detail: { action: "seen" } }));
      }
    } catch (err) {
      console.warn("Failed to mark staff requests as seen:", err);
    }
  }, []);

  // Polling setup: 10 second interval
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, REFETCH_INTERVAL_MS);

    const handleFocus = () => {
      fetchUnreadCount();
    };

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ action?: string }>;
      if (customEvent.detail?.action === "seen") {
        setUnreadCount(0);
      } else {
        fetchUnreadCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);
    window.addEventListener(STAFF_REQUESTS_SYNC_EVENT, handleSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener(STAFF_REQUESTS_SYNC_EVENT, handleSync);
    };
  }, [isAuthenticated, user, fetchUnreadCount]);

  return {
    unreadCount,
    totalPending,
    isLoading,
    refetch: fetchUnreadCount,
    markAsSeen,
  };
}

export function triggerStaffRequestsSync(action: "seen" | "refresh" = "refresh") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STAFF_REQUESTS_SYNC_EVENT, { detail: { action } }));
  }
}
