// Runs before `vite dev` and `vite build` via predev/prebuild hooks; writes public/sitemap.xml.
// Update `entries` when public routes change in src/App.tsx.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://calmora-calm.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/features", changefreq: "monthly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/auth", changefreq: "monthly", priority: "0.5" },
  { path: "/self-help", changefreq: "monthly", priority: "0.7" },
  { path: "/mood", changefreq: "monthly", priority: "0.7" },
  { path: "/journal", changefreq: "monthly", priority: "0.8" },
  { path: "/mindfulness", changefreq: "monthly", priority: "0.8" },
  { path: "/sounds", changefreq: "monthly", priority: "0.6" },
  { path: "/garden", changefreq: "monthly", priority: "0.7" },
  { path: "/chat", changefreq: "monthly", priority: "0.8" },
  { path: "/sleep", changefreq: "monthly", priority: "0.7" },
  { path: "/affirmations", changefreq: "monthly", priority: "0.6" },
  { path: "/assessments", changefreq: "monthly", priority: "0.7" },
  { path: "/cbt", changefreq: "monthly", priority: "0.7" },
  { path: "/community", changefreq: "weekly", priority: "0.7" },
  { path: "/crisis-support", changefreq: "monthly", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
