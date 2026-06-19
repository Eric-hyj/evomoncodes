import type { Metadata } from "next";
import { getMessages } from "next-intl/server";
import { JsonLd, WikiSidebar } from "@/components/site";
import { getAllContent, getContentTypes, getDynamicNavigation, type ContentItem } from "@/lib/content";
import { routing, type Locale } from "@/i18n/routing";
import en from "@/locales/en.json";
import HomePageClient from "./HomePageClient";
import { SITE_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "@/config/site";

type Messages = typeof en;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await getMessages({ locale })) as Messages;
  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`;
  const image = absoluteUrl(SITE_IMAGE);
  return {
    title: messages.home.meta.title,
    description: messages.home.meta.description,
    alternates: { canonical, languages: Object.fromEntries(routing.locales.map((loc) => [loc, loc === routing.defaultLocale ? "/" : `/${loc}`])) },
    openGraph: { title: messages.home.meta.title, description: messages.home.meta.description, url: absoluteUrl(canonical), images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const messages = (await getMessages({ locale })) as Messages;
  const navGroups = getDynamicNavigation(loc, messages.nav);
  const webSite = { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, description: messages.home.meta.description };

  // 动态加载所有 content 目录下的文章
  const allArticles: ContentItem[] = [];
  const contentTypes = getContentTypes(loc);
  for (const contentType of contentTypes) {
    const items = await getAllContent(contentType, loc);
    allArticles.push(...items);
  }
  const availableHrefs = [
    "/",
    ...contentTypes.map((contentType) => `/${contentType}`),
    ...allArticles.map((article) => `/${article.contentType}/${article.slug}`),
  ];

  // 取最近更新的 8 篇文章（按 date 倒序）
  const recentArticles = [...allArticles]
    .sort((a, b) => {
      const dateA = a.metadata.lastModified || a.metadata.date;
      const dateB = b.metadata.lastModified || b.metadata.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 8);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={webSite} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <HomePageClient home={messages.home} locale={locale} articles={allArticles} recentArticles={recentArticles} availableHrefs={availableHrefs} />
        <WikiSidebar locale={locale} navGroups={navGroups} />
      </div>
    </main>
  );
}
