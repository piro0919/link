"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type CallState = {
  callSessionId: string;
  conversationId: string;
  callType: "audio" | "video";
  role: "caller" | "callee";
  status: "ringing" | "accepted" | "ended";
  remoteName: string;
  remoteAvatarUrl: string | null;
};

type CallContextValue = {
  callState: CallState | null;
  currentUserId: string | null;
  initiateCall: (
    params: Omit<CallState, "role" | "status"> & { role?: "caller" | "callee" },
  ) => void;
  updateCallStatus: (status: CallState["status"]) => void;
  clearCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }): ReactNode {
  const [callState, setCallState] = useState<CallState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const callStateRef = useRef(callState);
  callStateRef.current = callState;

  // ブラウザ Supabase クライアントで自分の userId を取得
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getClaims().then(({ data }) => {
      const userId = data?.claims?.sub;
      if (typeof userId === "string") {
        setCurrentUserId(userId);
      }
    });
  }, []);

  // 着信の Realtime 監視
  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("call_sessions:incoming")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_sessions",
          filter: `callee_id=eq.${currentUserId}`,
        },
        async (payload) => {
          // 既に通話中なら無視
          if (callStateRef.current) return;

          const session = payload.new;
          if (session.status !== "ringing") return;

          // 発信者のプロフィールを取得
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", session.caller_id)
            .single();

          setCallState({
            callSessionId: session.id,
            conversationId: session.conversation_id,
            callType: session.call_type,
            role: "callee",
            status: "ringing",
            remoteName: profile?.display_name ?? "不明",
            remoteAvatarUrl: profile?.avatar_url ?? null,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // 通話状態の Realtime 監視（通話中のみ）
  useEffect(() => {
    if (!callState?.callSessionId) return;

    const supabase = createClient();
    const callSessionId = callState.callSessionId;

    const channel = supabase
      .channel(`call_sessions:${callSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_sessions",
          filter: `id=eq.${callSessionId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as string;
          if (newStatus === "accepted") {
            setCallState((prev) => (prev ? { ...prev, status: "accepted" } : null));
          } else if (newStatus === "rejected" || newStatus === "ended" || newStatus === "missed") {
            setCallState(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callState?.callSessionId]);

  const initiateCall = useCallback(
    (params: Omit<CallState, "role" | "status"> & { role?: "caller" | "callee" }) => {
      setCallState({
        ...params,
        role: params.role ?? "caller",
        status: "ringing",
      });
    },
    [],
  );

  const updateCallStatus = useCallback((status: CallState["status"]) => {
    setCallState((prev) => (prev ? { ...prev, status } : null));
  }, []);

  const clearCall = useCallback(() => {
    setCallState(null);
  }, []);

  return (
    <CallContext value={{ callState, currentUserId, initiateCall, updateCallStatus, clearCall }}>
      {children}
    </CallContext>
  );
}
