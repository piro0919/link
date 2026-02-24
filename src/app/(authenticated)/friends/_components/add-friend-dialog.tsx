"use client";

import { Loader2, Search, UserPlus } from "lucide-react";
import { type ReactNode, useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type SearchState, searchByLinkId, sendFriendRequest } from "../actions";

function SearchButton(): ReactNode {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="icon" className="shrink-0">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
    </Button>
  );
}

const initialState: SearchState = {};

export function AddFriendDialog(): ReactNode {
  const [state, formAction] = useActionState(searchByLinkId, initialState);
  const [sendError, setSendError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSend(userId: string): void {
    startTransition(async () => {
      const result = await sendFriendRequest(userId);
      if (result.error) {
        setSendError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  const result = state.result;
  const alreadyFriend = result?.requestStatus === "accepted";
  const alreadySent = result?.requestStatus === "pending" || sent;

  return (
    <Dialog
      onOpenChange={() => {
        setSendError(undefined);
        setSent(false);
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="outline">
          <UserPlus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>フレンドを追加</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search-link-id">Link ID</Label>
            <Input id="search-link-id" name="linkId" placeholder="Link IDを入力" required />
          </div>
          <SearchButton />
        </form>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        {result && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Avatar>
              <AvatarImage src={result.avatarUrl ?? undefined} alt={result.displayName} />
              <AvatarFallback>{result.displayName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{result.displayName}</p>
              <p className="text-sm text-muted-foreground">@{result.linkId}</p>
            </div>
            {alreadyFriend ? (
              <span className="text-sm text-muted-foreground">フレンド</span>
            ) : alreadySent ? (
              <span className="text-sm text-muted-foreground">送信済み</span>
            ) : (
              <Button size="sm" onClick={() => handleSend(result.id)} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : "追加"}
              </Button>
            )}
          </div>
        )}

        {sendError && <p className="text-sm text-destructive">{sendError}</p>}
      </DialogContent>
    </Dialog>
  );
}
