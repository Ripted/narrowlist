export const ITEMS_PER_PAGE = 20;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|$)/.test(u)
    || u.includes("youtube.com")
    || u.includes("youtu.be")
    || u.includes("twitch.tv")
    || u.includes("streamable.com")
    || u.includes("medal.tv")
    || u.includes("vimeo.com");
}
