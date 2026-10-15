import { headers } from "next/headers";
import { slugFromHost } from "@/lib/url";

/**
 * A same-site link inside a business's public pages: "/book" when the visitor is on
 * her subdomain, "/b/<slug>/book" otherwise. Saves a redirect on every click.
 */
export async function businessPath(slug: string, path = "") {
  const onSubdomain = slugFromHost((await headers()).get("host")) === slug;
  return onSubdomain ? path || "/" : `/b/${slug}${path}`;
}
