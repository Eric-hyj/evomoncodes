import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site";
import { routing } from "@/i18n/routing";
import { SITE_DESCRIPTION, SITE_IMAGE, SITE_LOGO, SITE_NAME, SITE_URL, absoluteUrl } from "@/config/site";
import { getDynamicNavigation } from "@/lib/content";
import en from "@/locales/en.json";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const image = absoluteUrl(SITE_IMAGE);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: "%s" },
    description: SITE_DESCRIPTION,
    openGraph: { type: "website", locale, url: SITE_URL, siteName: SITE_NAME, images: [{ url: image }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await getMessages()) as typeof en;
  const navGroups = getDynamicNavigation(locale as typeof routing.locales[number], messages.nav);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(SITE_LOGO),
    image: absoluteUrl(SITE_IMAGE),
  };

  return (
    <html lang={locale} className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NextIntlClientProvider messages={messages}>
            <JsonLd data={organization} />
            <SiteHeader locale={locale} navGroups={navGroups} />
            {children}
            <SiteFooter locale={locale} />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
