import Link from "next/link";
import { Github, Twitter, Instagram, Youtube } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#how", label: "How it works" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/signup", label: "Sign up" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#", label: "About" },
      { href: "/#", label: "Blog" },
      { href: "/#", label: "Careers" },
      { href: "/#", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/#", label: "Privacy" },
      { href: "/#", label: "Terms" },
      { href: "/#", label: "Cookies" },
      { href: "/#", label: "Disclaimer" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <BrandMark />
            <p className="mt-4 text-fg-muted text-sm max-w-sm">
              Training, fuel and progress — one sharp view. Built for lifters
              who don&apos;t need a coach in their pocket telling them they did a
              good job.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Youtube, href: "#", label: "YouTube" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 grid place-items-center rounded border border-border text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="font-mono-label text-fg-dim mb-4">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-fg-muted hover:text-fg transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-fg-dim">
            © {new Date().getFullYear()} FlexGain. All rights reserved.
          </p>
          {/* big watermark */}
          <span
            aria-hidden
            className="text-5xl sm:text-6xl font-bold tracking-tighter text-fg-dim/30 select-none"
          >
            FG
          </span>
        </div>
      </div>
    </footer>
  );
}
