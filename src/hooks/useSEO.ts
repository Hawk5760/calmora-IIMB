import { useEffect } from "react";

interface SEOOptions {
  ogType?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

export const useSEO = (title: string, description: string, canonicalPath = "/", options?: SEOOptions) => {
  useEffect(() => {
    document.title = title;

    // Meta description
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const fullUrl = window.location.origin + canonicalPath;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", options?.ogType || "website", true);
    setMeta("og:url", fullUrl, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:url", fullUrl);

    // Default brand OG image used when a route doesn't provide its own
    const ogImage = options?.ogImage || `${window.location.origin}/og-image.jpg`;
    setMeta("og:image", ogImage, true);
    setMeta("twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;

    // JSON-LD structured data (per-route, replaces previous route-injected one)
    const PREV_ID = "route-jsonld";
    document.querySelectorAll(`script[data-seo="${PREV_ID}"]`).forEach((el) => el.remove());
    if (options?.jsonLd) {
      const blocks = Array.isArray(options.jsonLd) ? options.jsonLd : [options.jsonLd];
      blocks.forEach((block) => {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.dataset.seo = PREV_ID;
        s.text = JSON.stringify(block);
        document.head.appendChild(s);
      });
    }
  }, [title, description, canonicalPath, options?.ogType, options?.ogImage, JSON.stringify(options?.jsonLd || null)]);
};
