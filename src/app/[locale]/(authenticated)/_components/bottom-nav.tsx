"use client";

import { MessageCircle, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  totalUnread: number;
};

export function BottomNav({ totalUnread }: BottomNavProps): ReactNode {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const tabs = [
    { href: "/" as const, label: t("talk"), icon: MessageCircle },
    { href: "/friends" as const, label: t("friends"), icon: Users },
    { href: "/profile" as const, label: t("profile"), icon: User },
  ];

  return (
    <nav className="flex border-t bg-background">
      {tabs.map((tab) => {
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div className="relative">
              <tab.icon className="size-5" />
              {tab.href === "/" && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] text-white">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
