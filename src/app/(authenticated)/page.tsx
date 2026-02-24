import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage(): Promise<ReactNode> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // TODO: メッセージ一覧の実装
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <p className="text-muted-foreground">Link - メッセージ一覧（実装予定）</p>
    </div>
  );
}
