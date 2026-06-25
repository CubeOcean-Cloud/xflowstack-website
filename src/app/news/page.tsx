"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  date: string;
  category: string;
  title: string;
  excerpt: string;
  slug?: string;
};

type ApiNewsResponse = {
  id: number;
  slug: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
};

const CATEGORY_STYLE: Record<string, string> = {
  Release: "text-signal-teal border-signal-teal/30",
  Infrastructure: "text-signal-violet border-signal-violet/30",
  Changelog: "text-ink-muted border-base-borderlight",
  Announcement: "text-signal-amber border-signal-amber/30",
};

const API_BASE_URL = "https://apix.cubeocean.web.id/api/news";

function transformApiResponse(apiItem: ApiNewsResponse): NewsItem {
  return {
    date: new Date(apiItem.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    category: apiItem.category,
    title: apiItem.title,
    excerpt: apiItem.content || "No description available",
    slug: apiItem.slug,
  };
}

async function fetchNewsItems(): Promise<{
  featured: NewsItem | null;
  articles: NewsItem[];
}> {
  try {
    // Client-side fetch: no `next.revalidate` here — that option only
    // applies to server-side fetches in Next.js and has no effect (and
    // is not type-valid) on a fetch running in the browser.
    const response = await fetch(`${API_BASE_URL}?page=1&limit=20`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    let items: NewsItem[] = [];

    if (Array.isArray(result)) {
      items = result.map((item: ApiNewsResponse) => transformApiResponse(item));
    } else if (result.data && Array.isArray(result.data)) {
      items = result.data.map((item: ApiNewsResponse) => transformApiResponse(item));
    } else if (result.items && Array.isArray(result.items)) {
      items = result.items.map((item: ApiNewsResponse) => transformApiResponse(item));
    }

    return {
      featured: items[0] || null,
      articles: items,
    };
  } catch (error) {
    console.error("Failed to fetch news items:", error);
    return {
      featured: null,
      articles: [],
    };
  }
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-3">
          <span className="h-5 w-20 animate-pulse rounded-full bg-base-border" />
          <span className="h-4 w-16 animate-pulse rounded bg-base-border" />
        </div>
        <div className="mt-5 h-7 w-3/4 animate-pulse rounded bg-base-border" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-base-border" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-base-border" />
      </div>
      <div className="hidden border-l border-base-border bg-base md:block" />
    </div>
  );
}

export default function NewsPage() {
  const [featured, setFeatured] = useState<NewsItem | null>(null);
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchNewsItems().then(({ featured, articles }) => {
      if (cancelled) return;
      setFeatured(featured);
      setArticles(articles);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">
          News
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl">
          What shipped, what broke, what changed
        </h1>
        <p className="mt-5 font-body text-base leading-relaxed text-ink-muted">
          Releases, infrastructure changes, and the occasional thing we
          fixed before you noticed it was broken.
        </p>
      </div>

      {/* FEATURED */}
      <div className="mt-14 overflow-hidden rounded-2xl border border-base-border bg-base-raised">
        {loading ? (
          <FeaturedSkeleton />
        ) : featured ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${CATEGORY_STYLE[featured.category]}`}
                >
                  {featured.category}
                </span>
                <span className="font-mono text-xs text-ink-faint">
                  {featured.date}
                </span>
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink-muted md:text-base">
                {featured.excerpt}
              </p>
            </div>
            <div className="relative hidden items-center justify-center border-l border-base-border bg-base p-10 md:flex">
              <svg viewBox="0 0 200 200" className="h-40 w-40" aria-hidden="true">
                <circle cx="100" cy="60" r="8" fill="#5EEAD4" />
                <circle cx="60" cy="130" r="6" fill="#3A3F47" />
                <circle cx="140" cy="130" r="6" fill="#3A3F47" />
                <path d="M100 68 L60 124" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5" />
                <path d="M100 68 L140 124" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5" />
                <path d="M60 136 L60 160" stroke="#3A3F47" strokeWidth="1.5" />
                <path d="M140 136 L140 160" stroke="#3A3F47" strokeWidth="1.5" />
                <circle cx="60" cy="168" r="4" fill="#1A1E24" stroke="#3A3F47" />
                <circle cx="140" cy="168" r="4" fill="#5EEAD4" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center font-body text-sm text-ink-muted">
            News content is not available.
          </div>
        )}
      </div>

      {/* ARTICLE GRID */}
      <h2 className="sr-only">More updates</h2>
      <div className="mt-16">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-base-border bg-base-raised/40 p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="h-5 w-16 animate-pulse rounded-full bg-base-border" />
                  <span className="h-4 w-14 animate-pulse rounded bg-base-border" />
                </div>
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-base-border" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-base-border" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.slug ?? article.title}
                className="flex flex-col rounded-2xl border border-base-border bg-base-raised/40 p-6 transition-colors hover:border-base-borderlight"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${CATEGORY_STYLE[article.category]}`}
                  >
                    {article.category}
                  </span>
                  <span className="font-mono text-xs text-ink-faint">
                    {article.date}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
                  {article.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink-muted break-words">
                  {article.excerpt}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-base-border bg-base-raised/40 p-8 text-center font-body text-sm text-ink-muted">
            No news items are available.
          </div>
        )}
      </div>
    </div>
  );
}