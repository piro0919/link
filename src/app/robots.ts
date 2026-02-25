import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    host: "https://link.kkweb.io",
    sitemap: "https://link.kkweb.io/sitemap.xml",
  };
}
