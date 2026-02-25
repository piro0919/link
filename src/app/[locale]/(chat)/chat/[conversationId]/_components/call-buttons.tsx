"use client";

import { Loader2, Phone, Video } from "lucide-react";
import { type ReactNode, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useCall } from "@/lib/call/call-context";
import { startCall } from "../call-actions";

type CallButtonsProps = {
  conversationId: string;
  remoteName: string;
  remoteAvatarUrl: string | null;
};

export function CallButtons({
  conversationId,
  remoteName,
  remoteAvatarUrl,
}: CallButtonsProps): ReactNode {
  const { initiateCall, callState } = useCall();
  const [isPending, startTransition] = useTransition();

  function handleCall(callType: "audio" | "video") {
    startTransition(async () => {
      const result = await startCall(conversationId, callType);
      if (result.error || !result.callSessionId) return;

      initiateCall({
        callSessionId: result.callSessionId,
        conversationId,
        callType,
        remoteName,
        remoteAvatarUrl,
      });
    });
  }

  const inCall = callState !== null;

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => handleCall("audio")}
        disabled={isPending || inCall}
      >
        {isPending ? <Loader2 className="size-5 animate-spin" /> : <Phone className="size-5" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => handleCall("video")}
        disabled={isPending || inCall}
      >
        <Video className="size-5" />
      </Button>
    </div>
  );
}
