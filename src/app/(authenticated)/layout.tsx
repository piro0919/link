import type { ReactNode } from "react";
import { PushSubscriptionManager } from "@/lib/push/push-subscription-manager";
import { BottomNav } from "./_components/bottom-nav";

export default function AuthenticatedLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <BottomNav />
      <PushSubscriptionManager />
    </div>
  );
}
