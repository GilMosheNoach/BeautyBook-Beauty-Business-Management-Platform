import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl, businessUrl } from "@/lib/url";

// Read from the database on each request, so new businesses appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await db.business.findMany({ where: { onboarded: true }, select: { slug: true } });
  return [
    { url: appUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: appUrl("/beauticians"), changeFrequency: "daily", priority: 0.9 },
    { url: appUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: appUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...businesses.flatMap((b) => [
      { url: businessUrl(b.slug), changeFrequency: "weekly" as const, priority: 0.8 },
      { url: businessUrl(b.slug, "/book"), changeFrequency: "weekly" as const, priority: 0.6 },
    ]),
  ];
}
