"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import type {
  AssignJobInput,
  CreateDispatchJobInput,
  DispatchAgent,
  DispatchFilters,
  DispatchJob,
  DispatchSnapshot,
  DispatchSortKey,
  UpdateAgentLocationInput,
  UpdateAgentStatusInput,
  UpdateJobStatusInput,
} from "./types";
import { filterJobs, recommendAgents, sortJobs, toLegacyJob, toMapFitter } from "./engine";
import { nudgeTowards } from "./geo";

const SNAPSHOT_URL = "/api/dispatch/snapshot";
const LOCAL_CACHE_KEY = "easy_blinds_dispatch_snapshot_v1";
const CHANNEL_NAME = "easy_blinds_dispatch_realtime";
const POLL_MS = 3500;

export function useDispatchOperations() {
  const [snapshot, setSnapshot] = useState<DispatchSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const persist = useCallback((next: DispatchSnapshot) => {
    setSnapshot(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(next));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(SNAPSHOT_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load dispatch snapshot.");
      const next = (await response.json()) as DispatchSnapshot;
      persist(next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch sync failed.");
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) setSnapshot(JSON.parse(cached) as DispatchSnapshot);
      }
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const broadcastRefresh = useCallback(() => {
    channelRef.current?.postMessage({ type: "dispatch-refresh", at: Date.now() });
  }, []);

  const mutate = useCallback(
    async <T,>(url: string, payload: unknown): Promise<T> => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Dispatch operation failed.");
      }
      const data = (await response.json()) as T;
      await refresh();
      broadcastRefresh();
      return data;
    },
    [broadcastRefresh, refresh],
  );

  useEffect(() => {
     
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = () => refresh();
    }
    return () => {
      window.clearInterval(timer);
      channelRef.current?.close();
    };
  }, [refresh]);

  useEffect(() => {
    if (!snapshot) return;
    const timer = window.setInterval(() => {
      setSnapshot((current) => {
        if (!current) return current;
        const nextAgents = current.agents.map((agent) => {
          const activeJob = current.jobs.find((job) => job.assignedAgentId === agent.id && ["On the Way", "In Progress"].includes(job.status));
          if (!activeJob) return agent;
          return {
            ...agent,
            location: nudgeTowards(agent.location, activeJob.coordinates, activeJob.status === "On the Way" ? 0.12 : 0.03),
            lastUpdated: new Date().toISOString(),
          };
        });
        return { ...current, agents: nextAgents, serverTime: new Date().toISOString() };
      });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [snapshot]);

  const createJob = useCallback((payload: CreateDispatchJobInput) => mutate<DispatchJob>("/api/dispatch/jobs", payload), [mutate]);
  const assignJob = useCallback((jobId: string, payload: AssignJobInput) => mutate<DispatchJob>(`/api/dispatch/jobs/${jobId}/assign`, payload), [mutate]);
  const updateJobStatus = useCallback((jobId: string, payload: UpdateJobStatusInput) => mutate<DispatchJob>(`/api/dispatch/jobs/${jobId}/status`, payload), [mutate]);
  const rescheduleJob = useCallback((jobId: string, payload: AssignJobInput) => mutate<DispatchJob>(`/api/dispatch/jobs/${jobId}/reschedule`, payload), [mutate]);
  const updateAgentStatus = useCallback((agentId: string, payload: UpdateAgentStatusInput) => mutate<DispatchAgent>(`/api/dispatch/agents/${agentId}/status`, payload), [mutate]);
  const updateAgentLocation = useCallback((agentId: string, payload: UpdateAgentLocationInput) => mutate<DispatchAgent>(`/api/dispatch/agents/${agentId}/location`, payload), [mutate]);

  const legacyJobs = useMemo(() => snapshot?.jobs.map(toLegacyJob) ?? [], [snapshot]);
  const mapFitters = useMemo(() => snapshot ? snapshot.agents.map((agent) => toMapFitter(agent, snapshot.jobs)) : [], [snapshot]);

  const queryJobs = useCallback(
    (filters: Partial<DispatchFilters>, sortKey: DispatchSortKey = "Default Sorting") => {
      const jobs = snapshot?.jobs ?? [];
      const normalized: DispatchFilters = { date: format(new Date(), "yyyy-MM-dd"), ...filters };
      return sortJobs(filterJobs(jobs, normalized), sortKey, snapshot?.agents ?? []);
    },
    [snapshot],
  );

  const recommendationsFor = useCallback(
    (jobId: string) => {
      const job = snapshot?.jobs.find((item) => item.id === jobId);
      if (!job || !snapshot) return [];
      return recommendAgents(job, snapshot.agents);
    },
    [snapshot],
  );

  return {
    snapshot,
    jobs: snapshot?.jobs ?? [],
    agents: snapshot?.agents ?? [],
    legacyJobs,
    mapFitters,
    isLoading,
    error,
    refresh,
    createJob,
    assignJob,
    updateJobStatus,
    rescheduleJob,
    updateAgentStatus,
    updateAgentLocation,
    queryJobs,
    recommendationsFor,
  };
}
