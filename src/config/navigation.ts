export const NAVIGATION_CONFIG = [
  { key: "codes", path: "/codes", isContentType: true },
  { key: "guide", path: "/guide", isContentType: true },
  { key: "creatures", path: "/creatures", isContentType: true },
  { key: "evolution", path: "/evolution", isContentType: true },
  { key: "islands", path: "/islands", isContentType: true },
  { key: "type-chart", path: "/type-chart", isContentType: true },
  { key: "shiny", path: "/shiny", isContentType: true },
  { key: "community", path: "/community", isContentType: true },
] as const;

export type NavigationKey = (typeof NAVIGATION_CONFIG)[number]["key"];

export const CONTENT_TYPES = NAVIGATION_CONFIG
  .filter((item) => item.isContentType)
  .map((item) => item.key);

export type ContentType = (typeof CONTENT_TYPES)[number];
