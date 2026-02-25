"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const PWAPrompt = dynamic(() => import("react-ios-pwa-prompt"), {
  ssr: false,
});

export function PwaPrompt() {
  const t = useTranslations("PWA");

  return (
    <PWAPrompt
      appIconPath="/icon-192.png"
      copyAddToHomeScreenStep={t("iosAddStep")}
      copyDescription={t("iosDescription")}
      copyShareStep={t("iosShareStep")}
      copyTitle={t("addToHomeScreen")}
      promptOnVisit={1}
      timesToShow={3}
    />
  );
}
