import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    description: "LINEライクなメッセージングアプリ",
    display: "standalone",
    icons: [
      {
        purpose: "maskable",
        sizes: "192x192",
        src: "/icon-192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icon-512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "ja",
    name: "Link",
    orientation: "portrait",
    short_name: "Link",
    start_url: "/",
    theme_color: "#09090b",
  };
}
