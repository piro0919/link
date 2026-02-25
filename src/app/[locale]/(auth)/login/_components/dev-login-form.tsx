"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type EmailLoginState, signInWithEmail } from "../actions";

function SubmitButton(): ReactNode {
  const t = useTranslations("Login");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="size-4 animate-spin" /> : t("loginButton")}
    </Button>
  );
}

const initialState: EmailLoginState = {};

export function DevLoginForm(): ReactNode {
  const t = useTranslations("Login");
  const [state, formAction] = useActionState(signInWithEmail, initialState);

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-muted-foreground">{t("devLogin")}</p>
      <form action={formAction} className="space-y-3">
        <Input name="email" type="email" placeholder={t("emailPlaceholder")} required />
        <Input name="password" type="password" placeholder={t("passwordPlaceholder")} required />
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <SubmitButton />
      </form>
    </div>
  );
}
