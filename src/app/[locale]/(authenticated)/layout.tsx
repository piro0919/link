import type { ReactNode } from "react";
import { PushSubscriptionManager } from "@/lib/push/push-subscription-manager";
import { PwaPrompt } from "@/lib/pwa/pwa-prompt";
import { BottomNavWrapper } from "./_components/bottom-nav-wrapper";

export default function AuthenticatedLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex-1">{children}</main>
      <BottomNavWrapper />
      <PushSubscriptionManager />
      <PwaPrompt />
    </div>
  );
}
