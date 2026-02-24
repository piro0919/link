"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";

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
