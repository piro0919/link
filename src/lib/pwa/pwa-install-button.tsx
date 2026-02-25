"use client";

import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { usePwa } from "use-pwa";
import { Button } from "@/components/ui/button";

export function PwaInstallButton(): ReactNode {
  const { canInstall, install, isInstalled, isSupported } = usePwa();

  if (!isSupported || isInstalled) {
    return null;
  }

  return (
    <Button onClick={install} disabled={!canInstall} variant="outline" className="w-full">
      <Download className="size-4" />
      アプリをインストール
    </Button>
  );
}
