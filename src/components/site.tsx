import Link from "next/link";
import { ChevronRight, ExternalLink, Moon, Play, Sun, Menu } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { NavGroup } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CollapsibleNavGroup } from "@/components/collapsible-nav-group";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ClientThemeToggle } from "@/components/theme-toggle";
import { resolveConfiguredHref } from "@/config/site";

export function localizeHref(href: string, locale: string) {
  if (locale === "en") return href;
  return `/${locale}${href === "/" ? "" : href}`;
}

export async function SiteHeader({ locale, navGroups }: { locale: string; navGroups: NavGroup[] }) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const site = await getTranslations({ locale, namespace: "site" });
  const header = (
    <div className="flex items-center justify-between gap-4">
      <Link href={localizeHref("/", locale)} className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-muted text-sm font-black text-foreground">{site("initials")}</span>
        <span className="text-sm font-bold tracking-wide text-foreground">{site("name")}</span>
      </Link>
      <nav className="hidden items-center gap-1 md:flex">
        {navGroups.map((group) => (
          <Link key={group.slug} href={localizeHref(`/${group.slug}`, locale)} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
            {group.title}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher locale={locale} />
        <ThemeToggle label={t("toggleTheme")} />
        <Sheet>
          <SheetTrigger asChild className="md:hidden"><Button variant="outline" size="icon" aria-label={t("menu")}><Menu className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent className="border-border bg-background text-foreground">
            <div className="mt-8 grid gap-2">
              {navGroups.map((group) => <Link key={group.slug} href={localizeHref(`/${group.slug}`, locale)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted">{group.title}</Link>)}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
  return <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl"><div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">{header}</div></header>;
}

function ThemeToggle({ label }: { label: string }) {
  return <ClientThemeToggle label={label} />;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{items.map((item, index) => <span key={`${item.label}-${index}`} className="flex items-center gap-2">{index > 0 && <ChevronRight className="h-4 w-4" />}{item.href ? <Link className="hover:text-foreground" href={item.href}>{item.label}</Link> : <span className="text-foreground">{item.label}</span>}</span>)}</nav>;
}

export async function WikiSidebar({ locale, navGroups, currentPath }: { locale: string; navGroups: NavGroup[]; currentPath?: string }) {
  const t = await getTranslations({ locale, namespace: "shared" });
  const sidebarCodes = t.raw("sidebarCodes") as Array<{ code: string; reward: string }>;
  const codesHref = t("viewAllCodesHref");
  const isActive = (href: string) => currentPath === href;
  return <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1"><section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm"><h3 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{t("wikiNavigation")}</h3><div className="space-y-4">{navGroups.map((group) => <CollapsibleNavGroup key={group.slug} title={group.title} icon={<span className="grid h-4 w-4 place-items-center rounded text-[10px] font-bold text-[hsl(var(--nav-theme))]">{group.title[0]}</span>} count={group.count} currentPath={currentPath}><ul className="space-y-1">{group.links.map((link) => <li key={link.href}><Link href={localizeHref(link.href, locale)} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${isActive(link.href) ? "bg-[hsl(var(--nav-theme)/0.15)] font-semibold text-[hsl(var(--nav-theme))]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><span className="truncate">{link.label}</span>{link.badge && <Badge variant="secondary" className="ml-auto h-5 border-border px-1.5 text-[10px]">{link.badge}</Badge>}</Link></li>)}</ul></CollapsibleNavGroup>)}</div></section><section className="rounded-2xl border border-border bg-card/60 p-5"><h3 className="mb-3 text-sm font-bold text-foreground">{t("activeCodes")}</h3><div className="space-y-3 text-sm">{sidebarCodes.map((item) => <div key={item.code} className="rounded-xl bg-muted p-3"><code className="font-bold text-foreground">{item.code}</code><p className="mt-1 text-muted-foreground">{item.reward}</p></div>)}<Link href={localizeHref(codesHref, locale)} className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--nav-theme))]">{t("viewAllCodes")} <ChevronRight className="h-4 w-4" /></Link></div></section></aside>;
}

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const site = await getTranslations({ locale, namespace: "site" });
  const featuredLink = t.raw("featuredLink") as { label: string; href: string };
  const linkGroups = t.raw("linkGroups") as Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  return <footer className="mt-16 border-t border-border bg-card/30"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-10 rounded-2xl border border-border bg-muted/40 p-5"><div className="font-bold text-foreground">{site("wikiName")}</div><p className="mt-1 text-sm text-muted-foreground">{t("description")}</p><Link href={resolveConfiguredHref(featuredLink.href)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--nav-theme))]">{featuredLink.label} <ExternalLink className="h-4 w-4" /></Link></div><p className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{site("legalNotice")}</p><div className="grid gap-8 md:grid-cols-4"><div className="md:col-span-2"><h3 className="font-bold text-foreground">{t("aboutTitle")}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{t("about")}</p></div>{linkGroups.map((group) => <FooterList key={group.title} locale={locale} title={group.title} links={group.links} />)}</div><p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">{t("copyright")}</p></div></footer>;
}

function FooterList({ locale, title, links }: { locale: string; title: string; links: Array<{ label: string; href: string }> }) {
  return <div><h4 className="font-semibold text-foreground">{title}</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{links.map((link) => {
    const href = resolveConfiguredHref(link.href);
    return <li key={link.href}><Link className="hover:text-foreground" href={href.startsWith("http") ? href : localizeHref(href, locale)}>{link.label}</Link></li>;
  })}</ul></div>;
}

export function TrailerCard({ videoId, alt, label }: { videoId: string; alt: string; label: string }) {
  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border shadow-lg transition-all duration-200">
      <div className="relative aspect-video w-full">
        <img src="/images/hero-trailer-thumbnail.jpg" alt={alt} className="size-full object-cover transition-all duration-200 group-hover:brightness-80" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md transition-transform duration-200 group-hover:scale-105 sm:size-24">
          <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md transition-transform duration-200 group-hover:scale-110 sm:size-16">
            <Play className="size-6 fill-white text-white sm:size-7" style={{ filter: "drop-shadow(rgba(0,0,0,0.07) 0 4px 3px) drop-shadow(rgba(0,0,0,0.06) 0 2px 2px)" }} />
          </div>
        </div>
      </div>
      <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white">{label}</span>
    </div>
  );
}

export function TrailerButton({ videoId, alt, label, closeLabel, openLabel }: { videoId: string; alt: string; label: string; closeLabel: string; openLabel: string }) {
  return (
    <div className="relative">
      <button id="trailer-cover" type="button" className="w-full" aria-label={label} onClick={() => { const cover = document.getElementById("trailer-cover") as HTMLButtonElement; const player = document.getElementById("trailer-player") as HTMLDivElement; const iframe = document.getElementById("trailer-iframe") as HTMLIFrameElement; iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`; cover.classList.add("hidden"); player.classList.remove("hidden"); }}>
        <TrailerCard videoId={videoId} alt={alt} label={label} />
      </button>
      <div id="trailer-player" className="hidden overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
        <iframe id="trailer-iframe" title={openLabel} className="aspect-video w-full" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black px-4 py-3">
          <a className="inline-flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-white" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">
            {openLabel} <ExternalLink className="h-4 w-4" />
          </a>
          <button className="text-sm font-medium text-white/70 hover:text-white" onClick={() => { const cover = document.getElementById("trailer-cover") as HTMLButtonElement; const player = document.getElementById("trailer-player") as HTMLDivElement; const iframe = document.getElementById("trailer-iframe") as HTMLIFrameElement; iframe.src = ""; player.classList.add("hidden"); cover.classList.remove("hidden"); }}>{closeLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) { return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />; }
