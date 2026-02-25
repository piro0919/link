import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PwaInstallButton } from "@/lib/pwa/pwa-install-button";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./_components/profile-form";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "プロフィール",
};

export default async function ProfilePage(): Promise<ReactNode> {
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
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            linkId={profile.link_id}
          />
          <PwaInstallButton />
          <Separator />
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full text-destructive">
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
