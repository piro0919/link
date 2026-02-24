"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProfileState, updateProfile } from "../actions";

type ProfileFormProps = {
  avatarUrl: string | null;
  displayName: string;
};

function SubmitButton(): ReactNode {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : "保存"}
    </Button>
  );
}

const initialState: ProfileState = {};

export function ProfileForm({ avatarUrl, displayName }: ProfileFormProps): ReactNode {
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex justify-center">
        <Avatar className="size-20">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-lg">{displayName.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          required
          maxLength={50}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-muted-foreground">プロフィールを更新しました</p>}

      <SubmitButton />
    </form>
  );
}
