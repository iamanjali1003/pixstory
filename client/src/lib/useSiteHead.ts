/**
 * useSiteHead.ts
 * ---------------------------------------------------------------------------
 * React hook that syncs <head> tags (title, description, OG, Twitter) with
 * the central SITE config from site.config.ts. Mounted once at the App root.
 *
 * The browser tab title is always just `SITE.name` (no tagline, no page
 * suffix) — keep it short and consistent across every route. The optional
 * `pageTitle` arg is still used to build richer OG/Twitter card titles for
 * link previews on social media (e.g. "Upload · pixStory").
 *
 * Edit site.config.ts to change any value — this hook just reflects it
 * into the DOM, so renaming the project in one place propagates to every
 * tab and link preview.
 */

import { useEffect } from 'react';
import { SITE } from './site.config';

function setMeta(attr: 'name' | 'property', key: string, value: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function useSiteHead(pageTitle?: string): void {
  useEffect(() => {
    document.title = SITE.name;

    const socialTitle = pageTitle
      ? `${pageTitle} · ${SITE.name}`
      : `${SITE.name} — ${SITE.tagline}`;

    setMeta('name', 'description', SITE.description);

    setMeta('property', 'og:title', socialTitle);
    setMeta('property', 'og:description', SITE.description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', SITE.url);
    setMeta('property', 'og:image', SITE.ogImage);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', socialTitle);
    setMeta('name', 'twitter:description', SITE.description);
    setMeta('name', 'twitter:image', SITE.ogImage);
  }, [pageTitle]);
}
