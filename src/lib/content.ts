import fs from "fs";
import path from "path";
import { routing, type Locale } from "@/i18n/routing";
import { CONTENT_TYPES, NAVIGATION_CONFIG, type ContentType } from "@/config/navigation";

/**
 * 将文件名转换为 URL-safe slug
 * 所有非字母数字连字符下划线的字符（冒号、问号、井号、空格等）替换为 -
 * 合并连续的 -，去掉首尾 -
 */
export function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/[^a-zA-Z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 根据 slug 在目录中反查真实文件名（不含 .mdx）
 * 例如 slug="gelum-boss" → 返回 "gelum:boss"
 */
export function findFileBySlug(dir: string, slug: string, basePath: string[] = []): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = findFileBySlug(fullPath, slug, [...basePath, entry.name]);
      if (result) return result;
    } else if (entry.name.endsWith(".mdx")) {
      const fileName = entry.name.replace(".mdx", "");
      const entrySlug = [...basePath, fileNameToSlug(fileName)].join("/");
      if (entrySlug === slug) {
        return [...basePath, fileName].join("/");
      }
    }
  }
  return null;
}

// 通用 Metadata 接口（与 MDX 文件 export const metadata 对应）
export interface ContentMetadata {
  title: string;
  description: string;
  category: string;
  date: string;
  lastModified?: string;
  image?: string;
  badge?: string;
  summary?: string;
}

// Heading 结构（从 MDX 源文件提取）
export interface Heading {
  id: string;
  text: string;
  level: number;
}

// 内容项接口
export interface ContentItem {
  slug: string;
  segments: string[];
  contentType: string;
  locale: Locale;
  metadata: ContentMetadata;
}

// 内容数据接口（含 MDX 组件）
export type ContentData = {
  slug: string;
  segments: string[];
  contentType: string;
  locale: Locale;
  metadata: ContentMetadata;
  MDXContent: React.ComponentType;
  headings: Heading[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getContentTypes(language: Locale = routing.defaultLocale): ContentType[] {
  const localeDir = path.join(CONTENT_ROOT, language);
  const fallbackDir = path.join(CONTENT_ROOT, routing.defaultLocale);

  return CONTENT_TYPES.filter((contentType) => {
    const localizedContentDir = path.join(localeDir, contentType);
    const fallbackContentDir = path.join(fallbackDir, contentType);
    return [localizedContentDir, fallbackContentDir].some((contentDir) =>
      fs.existsSync(contentDir) && fs.statSync(contentDir).isDirectory(),
    );
  });
}

export function isContentType(contentType: string, language: Locale = routing.defaultLocale) {
  return getContentTypes(language).includes(contentType as ContentType);
}

/**
 * 从 MDX 源文件中提取 ## 和 ### 标题
 */
function extractHeadings(mdxSource: string): Heading[] {
  const headings: Heading[] = [];
  const lines = mdxSource.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\{[^}]*\}/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

/**
 * 读取 MDX 源文件并提取 headings
 */
function getHeadingsFromFile(filePath: string): Heading[] {
  try {
    const source = fs.readFileSync(filePath, "utf-8");
    return extractHeadings(source);
  } catch {
    return [];
  }
}

/**
 * 辅助函数：递归获取目录下所有 MDX 文件的 slug 路径
 */
function getSlugsFromDirectory(dir: string, basePath: string[] = []): string[][] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const paths: string[][] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...getSlugsFromDirectory(fullPath, [...basePath, entry.name]));
    } else if (entry.name.endsWith(".mdx")) {
      const fileName = entry.name.replace(".mdx", "");
      paths.push([...basePath, fileNameToSlug(fileName)]);
    }
  }
  return paths;
}

function getMergedSlugEntries(contentType: string, language: Locale) {
  const localeDir = path.join(CONTENT_ROOT, language, contentType);
  const fallbackDir = path.join(CONTENT_ROOT, routing.defaultLocale, contentType);
  const entries = new Map<string, { segments: string[]; sourceLocale: Locale; sourceDir: string }>();

  for (const segments of getSlugsFromDirectory(fallbackDir)) {
    entries.set(segments.join("/"), {
      segments,
      sourceLocale: routing.defaultLocale,
      sourceDir: fallbackDir,
    });
  }

  for (const segments of getSlugsFromDirectory(localeDir)) {
    entries.set(segments.join("/"), {
      segments,
      sourceLocale: language,
      sourceDir: localeDir,
    });
  }

  return [...entries.values()];
}

/**
 * 获取所有内容列表（支持递归读取嵌套目录）
 * 使用动态 import 获取 MDX 文件的 metadata
 */
export async function getAllContent(contentType: string, language: Locale): Promise<ContentItem[]> {
  const slugEntries = getMergedSlugEntries(contentType, language);

  const items = await Promise.all(
    slugEntries.map(async ({ segments, sourceLocale, sourceDir }) => {
      const slug = segments.join("/");
      try {
        const realSlug = findFileBySlug(sourceDir, slug) || slug;
        const mod = await import(`../../content/${sourceLocale}/${contentType}/${realSlug}.mdx`);
        return {
          slug,
          segments,
          contentType,
          locale: sourceLocale,
          metadata: mod.metadata as ContentMetadata,
        } satisfies ContentItem;
      } catch {
        return null;
      }
    }),
  );

  return items
    .filter((item): item is ContentItem => Boolean(item))
    .sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));
}

/**
 * 获取单个内容项（含 MDX 渲染后的内容组件）
 * 使用动态 import 直接导入 .mdx 文件
 */
export async function getContent(contentType: string, slugSegments: string[], language: Locale): Promise<ContentData | null> {
  const currentSlug = slugSegments.join("/");
  const contentDir = path.join(CONTENT_ROOT, language, contentType);

  try {
    const realSlug = findFileBySlug(contentDir, currentSlug) || currentSlug;
    const mdxPath = path.join(contentDir, `${realSlug}.mdx`);
    const { default: MDXContent, metadata } = await import(
      `../../content/${language}/${contentType}/${realSlug}.mdx`
    );

    return {
      slug: currentSlug,
      segments: slugSegments,
      contentType,
      locale: language,
      metadata: metadata as ContentMetadata,
      MDXContent,
      headings: getHeadingsFromFile(mdxPath),
    };
  } catch {
    // Fallback 到英文
    if (language !== routing.defaultLocale) {
      try {
        const enContentDir = path.join(CONTENT_ROOT, routing.defaultLocale, contentType);
        const enRealSlug = findFileBySlug(enContentDir, currentSlug) || currentSlug;
        const enMdxPath = path.join(enContentDir, `${enRealSlug}.mdx`);
        const { default: MDXContent, metadata } = await import(
          `../../content/${routing.defaultLocale}/${contentType}/${enRealSlug}.mdx`
        );
        return {
          slug: currentSlug,
          segments: slugSegments,
          contentType,
          locale: routing.defaultLocale,
          metadata: metadata as ContentMetadata,
          MDXContent,
          headings: getHeadingsFromFile(enMdxPath),
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 导航分组结构（用于动态 Wiki Navigation）
 */
export interface NavGroup {
  /** 分组标题，来自目录名转人类可读格式，如 "bosses" → "Bosses" */
  title: string;
  /** 该分组下的文章数量 */
  count: number;
  /** 分组 slug（即目录名，如 "bosses"） */
  slug: string;
  /** 文章链接列表 */
  links: Array<{ label: string; href: string; badge?: string }>;
}

// 目录 slug → 人类可读标题（主语言）
export const GROUP_TITLES: Record<ContentType, string> = {
  codes: "Codes",
  guide: "Guides",
  creatures: "Creatures",
  evolution: "Evolution",
  islands: "Islands",
  "type-chart": "Type Chart",
  shiny: "Shiny",
  community: "Community",
};

// 多语言标题映射。key 必须与 NAVIGATION_CONFIG 中的内容分类 key 一致。
export const GROUP_TITLES_BY_LOCALE: Partial<Record<Locale, Record<ContentType, string>>> = {
  es: {
    codes: "Códigos",
    guide: "Guías",
    creatures: "Criaturas",
    evolution: "Evolución",
    islands: "Islas",
    "type-chart": "Tabla de Tipos",
    shiny: "Shiny",
    community: "Comunidad",
  },
  pt: {
    codes: "Códigos",
    guide: "Guias",
    creatures: "Criaturas",
    evolution: "Evolução",
    islands: "Ilhas",
    "type-chart": "Tabela de Tipos",
    shiny: "Shiny",
    community: "Comunidade",
  },
  ru: {
    codes: "Коды",
    guide: "Гайды",
    creatures: "Существа",
    evolution: "Эволюция",
    islands: "Острова",
    "type-chart": "Таблица Типов",
    shiny: "Шайни",
    community: "Сообщество",
  },
};

// 分组排序顺序，直接来自导航配置文件。
export const GROUP_ORDER: ContentType[] = NAVIGATION_CONFIG
  .filter((item) => item.isContentType)
  .map((item) => item.key);

/**
 * 动态生成 Wiki Navigation 分组
 * 扫描 content/<locale>/ 下的所有 MDX 文件，按子目录分组
 * 同时为列表页添加 Overview 入口
 */
export function getDynamicNavigation(language: Locale = "en", labels: Record<string, string> = {}): NavGroup[] {
  const localeDir = path.join(CONTENT_ROOT, language);
  if (!fs.existsSync(localeDir)) return [];

  const groups: NavGroup[] = [];

  for (const groupSlug of getContentTypes(language)) {
    const slugEntries = getMergedSlugEntries(groupSlug, language);

    const links: NavGroup["links"] = [];
    // 添加 Overview 入口（按 locale 翻译）
    const overviewLabel = labels.overview || "Overview";
    links.push({ label: overviewLabel, href: `/${groupSlug}` });

    for (const { segments, sourceDir } of slugEntries) {
      const articleSlug = segments.join("/");
      const mdxFilePath = findFileBySlug(sourceDir, articleSlug);
      if (!mdxFilePath) continue;

      const fullPath = path.join(sourceDir, `${mdxFilePath}.mdx`);
      let title = humanizeSlug(segments[segments.length - 1]);
      let badge: string | undefined;

      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        // 提取 metadata.title
        const titleMatch = source.match(/title:\s*["'](.+?)["']/);
        if (titleMatch) title = titleMatch[1];
        // 提取 metadata.badge
        const badgeMatch = source.match(/badge:\s*["'](.+?)["']/);
        if (badgeMatch) badge = badgeMatch[1];
      } catch {
        // 读取失败用默认标题
      }

      links.push({ label: title, href: `/${groupSlug}/${articleSlug}`, badge });
    }

    const groupTitle =
      labels[groupSlug] ||
      GROUP_TITLES_BY_LOCALE[language]?.[groupSlug as ContentType] ||
      GROUP_TITLES[groupSlug as ContentType] ||
      humanizeSlug(groupSlug);

    groups.push({
      title: groupTitle,
      count: links.length - 1, // 减去 Overview
      slug: groupSlug,
      links,
    });
  }

  // 按 GROUP_ORDER 排序
  groups.sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.slug as ContentType);
    const bi = GROUP_ORDER.indexOf(b.slug as ContentType);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return groups;
}

/**
 * 获取所有内容路径（用于 generateStaticParams）
 */
export async function getAllContentPaths(language: Locale) {
  const paths = getContentTypes(language).flatMap((contentType) =>
    getMergedSlugEntries(contentType, language).map((entry) => ({
      contentType,
      slug: entry.segments,
    })),
  );

  return paths;
}
