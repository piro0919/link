"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { type LinkIdState, type ProfileState, updateLinkId, updateProfile } from "../actions";

type ProfileFormProps = {
  avatarUrl: string | null;
  displayName: string;
  linkId: string;
};

function SubmitButton({ label }: { label: string }): ReactNode {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : label}
    </Button>
  );
}

const profileInitialState: ProfileState = {};
const linkIdInitialState: LinkIdState = {};

export function ProfileForm({ avatarUrl, displayName, linkId }: ProfileFormProps): ReactNode {
  const [profileState, profileAction] = useActionState(updateProfile, profileInitialState);
  const [linkIdState, linkIdAction] = useActionState(updateLinkId, linkIdInitialState);

  return (
    <div className="space-y-6">
      <form action={profileAction} className="space-y-6">
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

        {profileState.error && <p className="text-sm text-destructive">{profileState.error}</p>}
        {profileState.success && (
          <p className="text-sm text-muted-foreground">プロフィールを更新しました</p>
        )}

        <SubmitButton label="保存" />
      </form>

      <Separator />

      <form action={linkIdAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="linkId">Link ID</Label>
          <Input
            id="linkId"
            name="linkId"
            defaultValue={linkId}
            required
            minLength={4}
            maxLength={20}
            pattern="[a-z0-9_-]+"
            placeholder="例: taro_123"
          />
          <p className="text-xs text-muted-foreground">
            4〜20文字。小文字英数字、ハイフン、アンダースコアが使えます。
          </p>
        </div>

        {linkIdState.error && <p className="text-sm text-destructive">{linkIdState.error}</p>}
        {linkIdState.success && (
          <p className="text-sm text-muted-foreground">Link IDを更新しました</p>
        )}

        <SubmitButton label="Link IDを変更" />
      </form>
    </div>
  );
}
