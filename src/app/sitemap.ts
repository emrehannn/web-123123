import type { MetadataRoute } from "next";
import { lastModified, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: lastModified.home,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${siteUrl}/images/hero/walkin-about-hero-1920.jpg`, `${siteUrl}/images/walkin-wallpaper.png`],
    },
    {
      url: `${siteUrl}/walkin/development-journey`,
      lastModified: lastModified.journey,
      changeFrequency: "monthly",
      priority: 0.8,
      images: [`${siteUrl}/images/walkin-icon.png`],
    },
    {
      url: `${siteUrl}/waitlist`,
      lastModified: lastModified.waitlist,
      changeFrequency: "weekly",
      priority: 0.9,
      images: [`${siteUrl}/images/walkin-icon.png`],
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: lastModified.privacy,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
