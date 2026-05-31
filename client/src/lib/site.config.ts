/**
 * site.config.ts
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for everything brand- and meta-related across the
 * client app. Rename the project, change the tagline, swap the OG image, or
 * point GitHub somewhere else — edit it here and the navbar, footer, page
 * titles, meta description, and OG/Twitter cards all update.
 *
 * Anything user-visible that is NOT page content (button copy, form
 * messages, error text) should NOT live here — that stays with its component.
 * This file is just identity + metadata.
 *
 * If you rename the project, also update:
 *   - the `<title>` fallback in index.html (used before React mounts)
 *   - the repo URL on GitHub
 *   - the favicon at public/favicon.svg (optional)
 */

import { ImagePlus, type LucideIcon } from "lucide-react";

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  github: string;
  author: { name: string; url: string };
  logoIcon: LucideIcon;
}

export const SITE: SiteConfig = {
  name: "pixStory",
  shortName: "pixStory",
  tagline: "a shared gallery for the moments that mattered",
  description:
    "Upload, browse, and share photos from trips, workshops, and everyday activities.",
  url: "https://pixstory.app",
  ogImage: "/og.png",
  github: "https://github.com/iamanjali1003/pixstory",
  author: {
    name: "Anjali",
    url: "https://github.com/iamanjali1003",
  },
  logoIcon: ImagePlus,
};
