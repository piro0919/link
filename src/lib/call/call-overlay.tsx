"use client";

import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  endCall as endCallAction,
  generateSkyWayToken,
} from "@/app/(chat)/chat/[conversationId]/call-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCall } from "./call-context";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CallOverlay(): ReactNode {
  const { callState, currentUserId, clearCall } = useCall();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<unknown>(null);
  const roomRef = useRef<unknown>(null);
  const localAudioRef = useRef<unknown>(null);
  const localVideoRef = useRef<unknown>(null);
  const localVideoElRef = useRef<HTMLVideoElement>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement>(null);
  const cleanupRef = useRef(false);

  // 通話経過時間
  useEffect(() => {
    if (callState?.status !== "accepted") return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [callState?.status]);

  // 30秒タイムアウト（ringing のまま応答なし）
  useEffect(() => {
    if (!callState || callState.status !== "ringing" || callState.role !== "caller") return;
    const timeout = setTimeout(async () => {
      await endCallAction(callState.callSessionId);
      clearCall();
    }, 30000);
    return () => clearTimeout(timeout);
  }, [callState, clearCall]);

  // SkyWay 接続
  // biome-ignore lint/correctness/useExhaustiveDependencies: reconnect only on session/status/user change
  useEffect(() => {
    if (!callState || !currentUserId) return;
    // callee は accepted になるまで接続しない
    if (callState.role === "callee" && callState.status === "ringing") return;

    const session = callState;
    const userId = currentUserId;

    cleanupRef.current = false;
    setIsConnecting(true);
    setError(null);

    let disposed = false;

    async function connect() {
      try {
        const { SkyWayContext, SkyWayRoom, SkyWayStreamFactory } = await import("@skyway-sdk/room");

        const tokenResult = await generateSkyWayToken(
          session.conversationId,
          session.callSessionId,
        );
        if (tokenResult.error || !tokenResult.token) {
          setError(tokenResult.error ?? "トークンの取得に失敗しました");
          return;
        }

        if (disposed) return;

        const context = await SkyWayContext.Create(tokenResult.token);
        contextRef.current = context;

        const roomName = `call_${session.conversationId}_${session.callSessionId}`;
        const room = await SkyWayRoom.FindOrCreate(context, { type: "p2p", name: roomName });
        roomRef.current = room;

        if (disposed) {
          context.dispose();
          return;
        }

        const member = await room.join({ name: userId });

        // ローカルストリーム
        const audio = await SkyWayStreamFactory.createMicrophoneAudioStream();
        localAudioRef.current = audio;
        await member.publish(audio);

        if (session.callType === "video") {
          const video = await SkyWayStreamFactory.createCameraVideoStream();
          localVideoRef.current = video;
          await member.publish(video);
          if (localVideoElRef.current) {
            // biome-ignore lint/suspicious/noExplicitAny: SkyWay stream type
            localVideoElRef.current.srcObject = new MediaStream([(video as any).track]);
            localVideoElRef.current.play().catch(() => {});
          }
        }

        setIsConnecting(false);

        // リモートストリーム購読
        const subscribeToPublication = async (publication: unknown) => {
          // biome-ignore lint/suspicious/noExplicitAny: SkyWay publication type
          const pub = publication as any;
          if (pub.publisher.id === member.id) return;

          const { stream } = await member.subscribe(pub.id);
          // biome-ignore lint/suspicious/noExplicitAny: SkyWay stream type
          const s = stream as any;

          if (s.track) {
            if (s.contentType === "video" && remoteVideoElRef.current) {
              remoteVideoElRef.current.srcObject = new MediaStream([s.track]);
              remoteVideoElRef.current.play().catch(() => {});
            } else if (s.contentType === "audio" && remoteAudioElRef.current) {
              remoteAudioElRef.current.srcObject = new MediaStream([s.track]);
              remoteAudioElRef.current.play().catch(() => {});
            }
          }
        };

        // biome-ignore lint/suspicious/noExplicitAny: SkyWay room type
        for (const pub of (room as any).publications) {
          await subscribeToPublication(pub);
        }

        // biome-ignore lint/suspicious/noExplicitAny: SkyWay room event
        (room as any).onStreamPublished.add(async (e: any) => {
          await subscribeToPublication(e.publication);
        });

        // 相手が退室したら通話終了
        // biome-ignore lint/suspicious/noExplicitAny: SkyWay room event
        (room as any).onMemberLeft.add(async (e: any) => {
          if (e.member.id !== member.id) {
            await endCallAction(session.callSessionId);
            clearCall();
          }
        });
      } catch (e) {
        if (!disposed) {
          setError("通話の接続に失敗しました");
          // biome-ignore lint/suspicious/noConsole: useful for debugging SkyWay errors
          console.error("SkyWay connection error:", e);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      // biome-ignore lint/suspicious/noExplicitAny: SkyWay cleanup
      const audio = localAudioRef.current as any;
      // biome-ignore lint/suspicious/noExplicitAny: SkyWay cleanup
      const video = localVideoRef.current as any;
      // biome-ignore lint/suspicious/noExplicitAny: SkyWay cleanup
      const room = roomRef.current as any;
      // biome-ignore lint/suspicious/noExplicitAny: SkyWay cleanup
      const context = contextRef.current as any;

      if (audio?.release) audio.release();
      if (video?.release) video.release();
      if (room?.dispose) room.dispose();
      if (context?.dispose) context.dispose();

      localAudioRef.current = null;
      localVideoRef.current = null;
      roomRef.current = null;
      contextRef.current = null;
    };
  }, [callState?.callSessionId, callState?.status === "accepted", currentUserId]); // eslint-disable-line

  const handleHangUp = useCallback(async () => {
    if (callState) {
      await endCallAction(callState.callSessionId);
    }
    clearCall();
  }, [callState, clearCall]);

  const handleToggleMute = useCallback(() => {
    // biome-ignore lint/suspicious/noExplicitAny: SkyWay stream type
    const audio = localAudioRef.current as any;
    if (audio?.setEnabled) {
      audio.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleToggleCamera = useCallback(() => {
    // biome-ignore lint/suspicious/noExplicitAny: SkyWay stream type
    const video = localVideoRef.current as any;
    if (video?.setEnabled) {
      video.setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  }, [isCameraOff]);

  if (!callState) return null;

  const isVideo = callState.callType === "video";
  const isRinging = callState.status === "ringing";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900 text-white">
      {/* リモート映像 / アバター */}
      <div className="flex flex-1 items-center justify-center">
        {isVideo && !isRinging ? (
          // biome-ignore lint/a11y/useMediaCaption: call video
          <video ref={remoteVideoElRef} autoPlay playsInline className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-24">
              <AvatarImage
                src={callState.remoteAvatarUrl ?? undefined}
                alt={callState.remoteName}
              />
              <AvatarFallback className="bg-zinc-700 text-3xl">
                {callState.remoteName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xl font-medium">{callState.remoteName}</p>
            {isRinging && <p className="text-sm text-zinc-400">呼び出し中...</p>}
            {isConnecting && !isRinging && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="size-4 animate-spin" />
                接続中...
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {callState.status === "accepted" && !isConnecting && (
              <p className="text-sm text-zinc-400">{formatElapsed(elapsed)}</p>
            )}
          </div>
        )}
      </div>

      {/* ローカル映像 PiP */}
      {isVideo && !isRinging && (
        <div className="absolute right-4 top-4 h-40 w-28 overflow-hidden rounded-xl bg-zinc-800">
          <video
            ref={localVideoElRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />
        </div>
      )}

      {/* 通話中のステータス（ビデオ通話時） */}
      {isVideo && callState.status === "accepted" && !isConnecting && (
        <div className="absolute left-4 top-4">
          <p className="text-sm text-zinc-300">{formatElapsed(elapsed)}</p>
        </div>
      )}

      {/* リモート音声 */}
      {/* biome-ignore lint/a11y/useMediaCaption: call audio */}
      <audio ref={remoteAudioElRef} autoPlay />

      {/* コントロール */}
      <div className="flex items-center justify-center gap-6 pb-12 pt-6">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-14 rounded-full bg-zinc-700 hover:bg-zinc-600"
          onClick={handleToggleMute}
        >
          {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </Button>

        {isVideo && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-14 rounded-full bg-zinc-700 hover:bg-zinc-600"
            onClick={handleToggleCamera}
          >
            {isCameraOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
          </Button>
        )}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-14 rounded-full bg-red-600 hover:bg-red-500"
          onClick={handleHangUp}
        >
          <PhoneOff className="size-6" />
        </Button>
      </div>
    </div>
  );
}
