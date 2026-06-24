import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium plans",
  description:
    "Compare XflowStack's Free, Pro, and Studio plans — automation flow limits, log retention, gateway priority, and support response times.",
  alternates: {
    canonical: "/premium",
  },
  openGraph: {
    title: "Premium plans — XflowStack",
    description:
      "Compare XflowStack's Free, Pro, and Ultra — automation flow limits, log retention, gateway priority, and support response times.",
    url: "/premium",
  },
};

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What happens if I downgrade from Pro?",
    a: "Flows beyond the Free limit pause rather than delete. Reactivate them by upgrading again — nothing is lost.",
  },
  {
    q: "Is billing per server or per account?",
    a: "Per server. Studio plans covering multiple servers are billed as one invoice with a shared seat pool.",
  },
  {
    q: "Can I switch between monthly and annual billing?",
    a: "Yes, from the billing panel at any time. Switching applies at the next renewal, no proration headaches.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const PLANS: Array<{
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  cta: string;
  featured: boolean;
  features: string[];
}> = [

  {
    name: "Pro",
    price: "10",
    cadence: "",
    tagline: "For servers that run on this.",
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      "Everything in Free",
      "10 types of tickets",
      "Transcript in tickets",
      "250 create tickets per month",
      "API access for your website",
    ],
  },
  {
    name: "Ultra",
    price: "30",
    cadence: "per month",
    tagline: "For networks running several servers.",
    cta: "Upgrade to Ultra",
    featured: false,
    features: [
      "Access all features",
      "Unlimited all features",
    ],
  },
];

const COMPARE_ROWS: Array<{ label: string; free: string; pro: string; ultra: string }> = [
  { label: "Access", free: "Limited", pro: "Limited", ultra: "Unlock all" },
  { label: "API access", free: "—", pro: "YES", ultra: "YES" },
  { label: "API Limit", free: "-", pro: "100000 requests", ultra: "Unlimited" },
];


export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">
          Premium
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink md:text-5xl">
          Pricing that scales with your server, not your member count
        </h1>
        <p className="mt-5 font-body text-base leading-relaxed text-ink-muted">
          Every plan runs on the same infrastructure. Higher tiers buy
          retention, priority, and flow capacity — not a different bot.
        </p>
      </div>

      {/* PLAN CARDS */}
      <h2 className="sr-only">Plans</h2>
      <div className="mt-16">
        {PLANS.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  plan.featured
                    ? "border-signal-teal/50 bg-base-raised"
                    : "border-base-border bg-base-raised/60"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-signal-teal px-3 py-1 font-mono text-[11px] font-medium text-base">
                    Most used
                  </span>
                )}

                <h3 className="font-display text-lg font-semibold text-ink">
                  {plan.name}
                </h3>
                <p className="mt-1.5 font-body text-sm text-ink-muted">
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-medium text-ink">
                    ${plan.price}
                  </span>
                  <span className="font-body text-sm text-ink-faint">
                    {plan.cadence}
                  </span>
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 font-body text-sm text-ink-muted">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-signal-teal" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="#"
                  className={`mt-8 rounded-full px-5 py-2.5 text-center font-body text-sm font-medium transition-colors ${
                    plan.featured
                      ? "bg-signal-teal text-base hover:bg-ink"
                      : "border border-base-borderlight text-ink hover:border-ink-muted"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-base-border bg-base-raised p-8 text-center font-body text-sm text-ink-muted">
            Pricing information is not available.
          </div>
        )}
      </div>

      {/* COMPARISON TABLE */}
      <div className="mt-24">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Compare in detail
        </h2>

        <div className="mt-7 overflow-x-auto rounded-2xl border border-base-border">
          {COMPARE_ROWS.length > 0 ? (
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-base-border bg-base-raised">
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint">
                    Capability
                  </th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint">
                    Free
                  </th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-signal-teal">
                    Pro
                  </th>
                  <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint">
                    Ultra
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-base" : "bg-base-raised/40"}
                  >
                    <td className="px-6 py-4 font-body text-sm text-ink">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-ink-muted">
                      {row.free}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-ink">
                      {row.pro}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-ink-muted">
                      {row.ultra}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center font-body text-sm text-ink-muted">
              Feature comparison is not available.
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-24 max-w-3xl">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Questions people actually ask
        </h2>
        <div className="mt-7 divide-y divide-base-border border-y border-base-border">
          {FAQS.length > 0 ? (
            FAQS.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-body text-sm font-medium text-ink">
                  {item.q}
                  <span className="font-mono text-ink-faint transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink-muted">
                  {item.a}
                </p>
              </details>
            ))
          ) : (
            <div className="p-8 text-center font-body text-sm text-ink-muted">
              FAQ content is not available.
            </div>
          )}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
