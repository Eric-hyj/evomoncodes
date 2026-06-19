export const GAME_NAME = "Evomon";
export const SITE_NAME = `${GAME_NAME} Wiki`;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evomoncodes.wiki";
export const SITE_DESCRIPTION =
  "Evomon Wiki covers active codes, creatures list, evolution guide, starter tier list, type chart, shiny hunting, and beginner walkthroughs for Roblox players.";
export const SITE_IMAGE = "/images/hero.webp";
export const SITE_LOGO = "/android-chrome-512x512.png";
export const OFFICIAL_ROBLOX_URL = "https://www.roblox.com/games/134381727982611/Evomon";
export const OFFICIAL_DISCORD_URL = "https://discord.gg/GkcqPR7WEr";
export const OFFICIAL_YOUTUBE_URL = "https://www.youtube.com/watch?v=eQJCD-iyHzo";
export const OFFICIAL_TRAILER_VIDEO_ID = "eQJCD-iyHzo";

export const EXTERNAL_LINKS = {
  "official:roblox": OFFICIAL_ROBLOX_URL,
  "official:discord": OFFICIAL_DISCORD_URL,
  "official:youtube": OFFICIAL_YOUTUBE_URL,
} as const;

export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS;

export function resolveConfiguredHref(href: string) {
  return EXTERNAL_LINKS[href as ExternalLinkKey] || href;
}

export function absoluteUrl(pathname = "/") {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) return pathname;
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
