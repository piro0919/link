"use client";

import { Check, Loader2, X } from "lucide-react";
import { type ReactNode, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { acceptFriendRequest, rejectFriendRequest } from "../actions";

type FriendRequest = {
  id: string;
  sender: {
    displayName: string;
    avatarUrl: string | null;
    linkId: string;
  };
};

type FriendRequestListProps = {
  requests: FriendRequest[];
};

function RequestItem({ request }: { request: FriendRequest }): ReactNode {
  const [isPending, startTransition] = useTransition();

  function handleAccept(): void {
    startTransition(async () => {
      await acceptFriendRequest(request.id);
    });
  }

  function handleReject(): void {
    startTransition(async () => {
      await rejectFriendRequest(request.id);
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar>
        <AvatarImage src={request.sender.avatarUrl ?? undefined} alt={request.sender.displayName} />
        <AvatarFallback>{request.sender.displayName.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{request.sender.displayName}</p>
        <p className="text-sm text-muted-foreground">@{request.sender.linkId}</p>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="outline" onClick={handleAccept} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function FriendRequestList({ requests }: FriendRequestListProps): ReactNode {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">フレンドリクエスト</h3>
      <div className="divide-y">
        {requests.map((request) => (
          <RequestItem key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
