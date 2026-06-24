import Link from "next/link";
import NeuralNetworkHero from "@/components/NeuralNetworkHero";

const FEATURES = [
  {
    label: "Moderation",
    title: "Rules enforce themselves",
    body: "Raid detection, word filters, and escalation tiers run on every message without you watching the log channel.",
  },
  {
    label: "Automation",
    title: "Workflows, not commands",
    body: "Chain triggers across roles, channels, and external webhooks. Build a flow once, it runs on every member after.",
  },
  {
    label: "Reliability",
    title: "Uptime you can verify",
    body: "Every shard, node, and DNS check is on a public status page. No \"we're aware of the issue\" tweets.",
  },
  {
    label: "API",
    title: "Connect to website",  
    body: "Connect discord bot with u website and get data from discord bot to your website and vice versa.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-base-border">
        <div className="absolute inset-0">
          <NeuralNetworkHero />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-base/40 via-base/70 to-base" />

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-base-borderlight bg-base-raised/60 px-3.5 py-1.5 font-mono text-xs text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
              View live status and infrastructure health
            </div>

            <h1 className="text-balance font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl md:text-6xl">
              Automate all your community activities with discord bots
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance font-body text-base leading-relaxed text-ink-muted md:text-lg">
              Moderation, role automation, and analytics built like
              infrastructure — with the uptime numbers to prove it, not just
              the promise.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="https://discord.com/oauth2/authorize?client_id=1518919855749726289&permissions=8&integration_type=0&scope=bot"
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-full bg-ink px-7 py-3 text-center font-body text-sm font-medium text-base transition-colors hover:bg-signal-teal sm:w-auto"
              >
                Add to Discord
              </Link>
              <Link
                href="https://docs-xflowstack.cubeocean.web.id"
                className="w-full rounded-full border border-base-borderlight px-7 py-3 text-center font-body text-sm font-medium text-ink transition-colors hover:border-ink-muted sm:w-auto"
              >
                documentation
              </Link>
            </div>
          </div>

          <div className="mt-24">
            <p className="text-center font-mono text-xs uppercase tracking-wider text-ink-faint">
              Trusted by teams across Discord communities
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-b border-base-border bg-base">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-wider text-signal-teal">
              What it does
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink md:text-4xl">
              One bot, four jobs it actually finishes
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-base-border bg-base-border sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-base-raised p-8">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
                  {f.label}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="bg-base">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Set it up in the time it takes to read this page
          </h2>
          <p className="mx-auto mt-4 max-w-md font-body text-ink-muted">
            No credit card for the free tier. Cancel premium whenever, your
            settings stay put.
          </p>
          <div className="mt-8">
            <Link
              href="https://discord.com/oauth2/authorize?client_id=1518919855749726289&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-ink px-8 py-3 font-body text-sm font-medium text-base transition-colors hover:bg-signal-teal"
            >
              Add to Discord
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}