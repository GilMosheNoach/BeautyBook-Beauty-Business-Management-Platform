import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Owner screens and each client's private appointment page stay out of search.
      disallow: ["/dashboard", "/onboarding", "/subscribe", "/api/", "/a/", "/b/*/a/"],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}
