import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "./bottom-nav";

export async function BottomNavWrapper(): Promise<ReactNode> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  let totalUnread = 0;
  if (user) {
    const { data: unreadCounts } = await supabase.rpc("get_unread_counts");
    totalUnread = (unreadCounts ?? []).reduce((sum, row) => sum + Number(row.unread_count), 0);
  }

  return <BottomNav totalUnread={totalUnread} />;
}
