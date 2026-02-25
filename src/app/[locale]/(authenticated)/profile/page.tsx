import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PwaInstallButton } from "@/lib/pwa/pwa-install-button";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./_components/profile-form";
import { signOut } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Profile");
  return { title: t("title") };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, link_id")
    .eq("id", user.sub)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex items-start justify-center p-4 pt-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            linkId={profile.link_id}
          />
          <PwaInstallButton />
          <Separator />
          <ThemeToggle />
          <Separator />
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full text-destructive">
              {t("logout")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
