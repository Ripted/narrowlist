import { useEffect } from "react";

const SITE_NAME = "Narrowlist";
const DEFAULT_TITLE = "Narrowlist";
const DEFAULT_DESCRIPTION =
  "The official hardest level ranking for Narrow Arrow — Main, Extra, and Future lists, leaderboards, and player profiles.";
const DEFAULT_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2f40fcd6-c9f4-44fc-9316-08588870160a/id-preview-6240011e--a35f5cb4-50cd-46b9-a50b-35e488d1d3e9.lovable.app-1776864005229.png";

interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string | null;
}

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    if (attrs.property) el.setAttribute("property", attrs.property);
    if (attrs.name) el.setAttribute("name", attrs.name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", attrs.content);
}

export function PageMeta({ title, description, image }: PageMetaProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const img = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: desc });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: desc });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: img });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: window.location.href });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: img });

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('meta[name="description"]', { name: "description", content: DEFAULT_DESCRIPTION });
      upsertMeta('meta[property="og:title"]', { property: "og:title", content: DEFAULT_TITLE });
      upsertMeta('meta[property="og:description"]', { property: "og:description", content: DEFAULT_DESCRIPTION });
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: DEFAULT_IMAGE });
      upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: DEFAULT_TITLE });
      upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: DEFAULT_DESCRIPTION });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: DEFAULT_IMAGE });
    };
  }, [fullTitle, desc, img]);

  return null;
}
