"use client";

import dynamic from "next/dynamic";

const PWAPrompt = dynamic(() => import("react-ios-pwa-prompt"), {
  ssr: false,
});

export function PwaPrompt() {
  return (
    <PWAPrompt
      appIconPath="/icon-192.png"
      copyAddToHomeScreenStep="2) 「ホーム画面に追加」をタップします。"
      copyDescription="このウェブサイトにはアプリ機能があります。ホーム画面に追加してフルスクリーンおよびオフラインで使用できます。"
      copyShareStep="1) （四角から矢印が飛び出したマーク）をタップします。"
      copyTitle="ホーム画面に追加"
      promptOnVisit={1}
      timesToShow={3}
    />
  );
}
