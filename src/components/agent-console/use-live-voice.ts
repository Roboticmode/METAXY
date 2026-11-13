"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/lib/assistant/types";

export type LiveStatus = "idle" | "connecting" | "live" | "error";

type UseLiveVoiceOpts = {
  getSnapshot: () => Snapshot;
  pushLiveTranscript: (role: "user" | "assistant", delta: string, turnKey: string) => void;
  pushLiveStep: (text: string, tone?: "ok" | "warn") => void;
  runLiveTool: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

type DelegationBatch = {
  queue: Promise<void>;
  outputs: { call_id: string; output: string }[];
  completed: boolean;
  flushed: boolean;
  fallbackTimer: ReturnType<typeof setTimeout> | null;
};

type LiveServerEvent = {
  type?: string;
  delta?: string;
  delegation_id?: string;
  error?: { message?: string };
  event?: {
    type?: string;
    item?: {
      type?: string;
      call_id?: string;
      name?: string;
      arguments?: string;
    };
  };
};

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 1500): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onState);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = setTimeout(done, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onState);
  });
}

export function useLiveVoice({ getSnapshot, pushLiveTranscript, pushLiveStep, runLiveTool }: UseLiveVoiceOpts) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<{ live: string; backend: string } | null>(null);

  const optsRef = useRef({ getSnapshot, pushLiveTranscript, pushLiveStep, runLiveTool });
  optsRef.current = { getSnapshot, pushLiveTranscript, pushLiveStep, runLiveTool };

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const batchesRef = useRef<Map<string, DelegationBatch>>(new Map());
  const transcriptTurnRef = useRef<{ role: "user" | "assistant"; at: number; seq: number; key: string } | null>(null);

  const cleanup = useCallback((sendClose = false) => {
    const dc = dcRef.current;
    if (sendClose && dc && dc.readyState === "open") {
      try {
        dc.send(JSON.stringify({ type: "session.close" }));
      } catch {
        // ignore send errors during teardown
      }
    }
    dcRef.current = null;

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        // ignore close errors
      }
      pcRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }

    for (const batch of batchesRef.current.values()) {
      if (batch.fallbackTimer) clearTimeout(batch.fallbackTimer);
    }
    batchesRef.current.clear();
    transcriptTurnRef.current = null;
    setMuted(false);
  }, []);

  const disconnect = useCallback(() => {
    cleanup(true);
    setStatus("idle");
    setError(null);
  }, [cleanup]);

  useEffect(() => () => cleanup(true), [cleanup]);

  const sendEvent = useCallback((payload: unknown) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return false;
    dc.send(JSON.stringify(payload));
    return true;
  }, []);

  const flushBatch = useCallback(
    async (delegationId: string) => {
      const batch = batchesRef.current.get(delegationId);
      if (!batch || batch.flushed) return;
      await batch.queue;
      if (batch.flushed || batch.outputs.length === 0) return;
      batch.flushed = true;
      if (batch.fallbackTimer) {
        clearTimeout(batch.fallbackTimer);
        batch.fallbackTimer = null;
      }
      for (const item of batch.outputs) {
        sendEvent({
          type: "response.item.create",
          item: {
            type: "function_call_output",
            call_id: item.call_id,
            output: item.output,
          },
        });
      }
      sendEvent({ type: "response.create" });
      batchesRef.current.delete(delegationId);
    },
    [sendEvent],
  );

  const appendTranscript = useCallback((role: "user" | "assistant", delta: string) => {
    if (!delta) return;
    const now = Date.now();
    const cur = transcriptTurnRef.current;
    if (cur && cur.role === role && now - cur.at < 2000) {
      cur.at = now;
      optsRef.current.pushLiveTranscript(role, delta, cur.key);
      return;
    }
    const nextSeq = (cur?.seq ?? 0) + 1;
    const key = `live-${role}-${nextSeq}`;
    transcriptTurnRef.current = { role, at: now, seq: nextSeq, key };
    optsRef.current.pushLiveTranscript(role, delta, key);
  }, []);

  const handleServerEvent = useCallback(
    (ev: LiveServerEvent) => {
      switch (ev.type) {
        case "session.started":
          setStatus("live");
          optsRef.current.pushLiveStep("Live voice connected (GPT-Live 1 + GPT-6 Luna)");
          break;
        case "session.input_transcript.delta":
          if (typeof ev.delta === "string") appendTranscript("user", ev.delta);
          break;
        case "session.output_transcript.delta":
          if (typeof ev.delta === "string") appendTranscript("assistant", ev.delta);
          break;
        case "response.event": {
          const delegationId = ev.delegation_id || "default";
          const inner = ev.event;
          if (!inner) break;
          if (inner.type === "response.output_item.done" && inner.item?.type === "function_call") {
            const { call_id, name, arguments: rawArgs } = inner.item;
            if (!call_id || !name) break;
            let batch = batchesRef.current.get(delegationId);
            if (!batch) {
              batch = { queue: Promise.resolve(), outputs: [], completed: false, flushed: false, fallbackTimer: null };
              batchesRef.current.set(delegationId, batch);
            }
            const activeBatch = batch;
            activeBatch.queue = activeBatch.queue.then(async () => {
              let parsedArgs: Record<string, unknown> = {};
              try {
                parsedArgs = JSON.parse(rawArgs || "{}");
              } catch {
                parsedArgs = {};
              }
              const result = await optsRef.current.runLiveTool(name, parsedArgs);
              activeBatch.outputs.push({ call_id, output: JSON.stringify(result) });
            });
            if (activeBatch.fallbackTimer) clearTimeout(activeBatch.fallbackTimer);
            activeBatch.fallbackTimer = setTimeout(() => {
              void flushBatch(delegationId);
            }, 1500);
          } else if (inner.type === "response.completed") {
            const batch = batchesRef.current.get(delegationId);
            if (batch) {
              batch.completed = true;
              void flushBatch(delegationId);
            }
          }
          break;
        }
        case "session.closed":
          cleanup(false);
          setStatus("idle");
          break;
        case "error": {
          const msg = ev.error?.message || "Live voice session error";
          setError(msg);
          optsRef.current.pushLiveStep(`Live voice error: ${msg}`, "warn");
          break;
        }
      }
    },
    [appendTranscript, cleanup, flushBatch],
  );

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "live") return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      setError("Live voice requires microphone and WebRTC support in your browser.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("connecting");

    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = mic;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      for (const track of mic.getTracks()) {
        pc.addTrack(track, mic);
      }

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.setAttribute("playsinline", "true");
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        if (audioRef.current && e.streams[0]) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          cleanup(false);
          setStatus((cur) => (cur === "error" ? cur : "idle"));
        }
      };

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("message", (msgEv) => {
        try {
          const parsed = JSON.parse(String(msgEv.data)) as LiveServerEvent;
          handleServerEvent(parsed);
        } catch {
          // ignore non-JSON frames
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc, 1500);

      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error("Failed to build WebRTC SDP offer.");

      const res = await fetch("/api/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp, snapshot: optsRef.current.getSnapshot() }),
      });
      const data = (await res.json()) as {
        error?: string;
        liveModel?: string;
        backendModel?: string;
        transport?: { sdp?: string };
      };
      if (!res.ok || !data.transport?.sdp) {
        throw new Error(data.error || `Failed to start live session (HTTP ${res.status})`);
      }

      setModels({
        live: data.liveModel || "gpt-live-1",
        backend: data.backendModel || "gpt-6-luna",
      });

      await pc.setRemoteDescription({ type: "answer", sdp: data.transport.sdp });
    } catch (err) {
      cleanup(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
      optsRef.current.pushLiveStep(`Couldn't start live voice: ${msg}`, "warn");
    }
  }, [cleanup, handleServerEvent, status]);

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    setMuted((prev) => {
      const next = !prev;
      for (const track of stream.getAudioTracks()) track.enabled = !next;
      return next;
    });
  }, []);

  return {
    status,
    muted,
    error,
    models,
    connect,
    disconnect,
    toggleMute,
  };
}
