"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";

export type EmailLoginState = {
  error?: string;
};

export async function signInWithEmail(
  _prevState: EmailLoginState,
  formData: FormData,
): Promise<EmailLoginState> {
  const supabase = await createClient();
  const t = await getTranslations("Login");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: t("invalidCredentials") };
  }

  redirect("/");
}

export async function signInWithGoogle(): Promise<never> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || env.SITE_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_error");
  }

  redirect(data.url);
}
