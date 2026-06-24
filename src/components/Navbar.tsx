"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/premium", label: "Premium" },
  { href: "/status", label: "Status" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-base-border/80 bg-base/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-signal-teal/40 bg-signal-tealdim/40">
            <span className="h-2 w-2 rounded-sm bg-signal-teal" />
          </span>
          <span className="font-display text-[17px] font-semibold tracking-tight text-ink">
            XflowStack
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-body text-sm transition-colors ${
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-signal-teal" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/status"
            className="rounded-full border border-base-borderlight px-4 py-2 font-mono text-xs text-ink-muted transition-colors hover:border-signal-teal/50 hover:text-signal-teal"
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal-teal align-middle" />
            View live status
          </Link>
          <Link
            href="https://discord.com/oauth2/authorize?client_id=1518919855749726289&permissions=8&integration_type=0&scope=bot"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ink px-5 py-2 font-body text-sm font-medium text-base transition-colors hover:bg-signal-teal"
          >
            Add to Discord
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-base-border text-ink md:hidden"
        >
          <span className="flex flex-col gap-[3px]">
            <span className={`h-[1.5px] w-4 bg-current transition-transform ${open ? "translate-y-[4.5px] rotate-45" : ""}`} />
            <span className={`h-[1.5px] w-4 bg-current transition-opacity ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`h-[1.5px] w-4 bg-current transition-transform ${open ? "-translate-y-[4.5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-base-border bg-base px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`font-body text-sm ${
                  pathname === link.href ? "text-signal-teal" : "text-ink-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://discord.com/oauth2/authorize?client_id=1518919855749726289&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ink px-5 py-2 text-center font-body text-sm font-medium text-base"
            >
              Add to Discord
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
