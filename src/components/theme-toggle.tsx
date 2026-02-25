"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle(): ReactNode {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ];

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{t("label")}</span>
      <div className="flex gap-1">
        {themes.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTheme(item.value)}
            className={cn(theme === item.value && "border-primary text-primary")}
          >
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
