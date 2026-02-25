"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
  { value: "system", label: "自動", icon: Monitor },
] as const;

export function ThemeToggle(): ReactNode {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">テーマ</span>
      <div className="flex gap-1">
        {themes.map((t) => (
          <Button
            key={t.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTheme(t.value)}
            className={cn(theme === t.value && "border-primary text-primary")}
          >
            <t.icon className="size-4" />
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
