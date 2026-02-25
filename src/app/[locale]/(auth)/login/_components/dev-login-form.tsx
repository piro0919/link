"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type EmailLoginState, signInWithEmail } from "../actions";

function SubmitButton(): ReactNode {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : "ログイン"}
    </Button>
  );
}

const initialState: EmailLoginState = {};

export function DevLoginForm(): ReactNode {
  const [state, formAction] = useActionState(signInWithEmail, initialState);

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-muted-foreground">開発用ログイン</p>
      <form action={formAction} className="space-y-3">
        <Input name="email" type="email" placeholder="メールアドレス" required />
        <Input name="password" type="password" placeholder="パスワード" required />
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
