import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for supported locales.
 *
 * To add a new language you must update THREE places that have to stay in sync:
 *   1. The `locales` array below.
 *   2. The static imports + `messagesMap` in `src/i18n/request.ts`.
 *   3. The matching JSON file in `src/locales/<locale>.json`.
 */
export const routing = defineRouting({
  locales: ["en", "pt", "es", "ru"],
  defaultLocale: "en",
  // English is served without a locale prefix, while translated sections use their locale prefix.
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
