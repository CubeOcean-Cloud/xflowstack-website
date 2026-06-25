import Link from "next/link";
import VersionBadges from "@/components/VersionBadges";

export default function Footer() {
  return (
    <footer className="border-t border-base-border bg-base-raised">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-signal-teal/40 bg-signal-tealdim/40">
                <span className="h-2 w-2 rounded-sm bg-signal-teal" />
              </span>
              <span className="font-display text-[16px] font-semibold text-ink">
                XflowStack
              </span>
            </div>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-ink-muted">
              Automation infrastructure for Discord servers that have outgrown
              hobby bots. Built for uptime, not for show.
            </p>
            <VersionBadges />
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
              Product
            </p>
            <ul className="mt-4 space-y-3 font-body text-sm text-ink-muted">
              <li><Link href="/" className="hover:text-ink">Overview</Link></li>
              <li><Link href="/premium" className="hover:text-ink">Premium plans</Link></li>
              <li><Link href="/status" className="hover:text-ink">Infrastructure status</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
              Resources
            </p>
            <ul className="mt-4 space-y-3 font-body text-sm text-ink-muted">
              <li><Link href="/news" className="hover:text-ink">Changelog &amp; news</Link></li>
              <li><Link href="/status" className="hover:text-ink">Incident history</Link></li>
              <li><a href="#" className="hover:text-ink">Command reference</a></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">
              Company
            </p>
            <ul className="mt-4 space-y-3 font-body text-sm text-ink-muted">
              <li><a href="#" className="hover:text-ink">Support server</a></li>
              <li><a href="#" className="hover:text-ink">Terms of service</a></li>
              <li><a href="#" className="hover:text-ink">Privacy policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-base-border pt-6 md:flex-row md:items-center">
          <p className="font-mono text-xs text-ink-faint">
            &copy; 2026 XflowStack. Developed by CubeOcean. All rights reserved.
          </p>
          <div className="flex gap-5 font-mono text-xs text-ink-faint">
            <a href="#" className="hover:text-ink-muted">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}