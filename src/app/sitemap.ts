import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; freq: "daily" | "hourly" | "weekly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/premium", priority: 0.9, freq: "weekly" },
    { path: "/status", priority: 0.8, freq: "hourly" },
    { path: "/news", priority: 0.8, freq: "daily" },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.freq,
    priority: route.priority,
  }));
}
