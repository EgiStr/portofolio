import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/cv";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/v/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
