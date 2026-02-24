"use client";

import { MessageCircle, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "トーク", icon: MessageCircle },
  { href: "/friends", label: "フレンド", icon: Users },
  { href: "/profile", label: "プロフィール", icon: User },
] as const;

export function BottomNav(): ReactNode {
  const pathname = usePathname();

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
            <tab.icon className="size-5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
