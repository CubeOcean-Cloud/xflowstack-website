import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-signal-red">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
        This route never resolved
      </h1>
      <p className="mt-3 font-body text-sm text-ink-muted">
        No node is serving this page. Check the address or head back home.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-ink px-6 py-2.5 font-body text-sm font-medium text-base transition-colors hover:bg-signal-teal"
      >
        Back to home
      </Link>
    </div>
  );
}
