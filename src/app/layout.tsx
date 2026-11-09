import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/version";
import { kb } from "@/modules/knowledge-base";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tech Stack Advisor", template: "%s · Tech Stack Advisor" },
  description:
    "Answer a few questions about your project and team and get a full tech stack (language, frontend, backend, database and hosting), ranked and explained.",
};

const nav = [
  { href: "/advisor", label: "Advisor" },
  { href: "/#examples", label: "Examples" },
  { href: "/methodology", label: "How it works" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/advisor?new", label: "Start a recommendation" },
      { href: "/#examples", label: "Examples" },
      { href: "/methodology", label: "How it works" },
      { href: "/changelog", label: "What's new" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About" },
      { href: "https://github.com/lochana-dahanayake/tech-stack-advisor", label: "Source on GitHub" },
      { href: "https://architecture-advisor-pink.vercel.app", label: "Architecture Advisor" },
    ],
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <header className="no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link
              href="/"
              className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-label="Tech Stack Advisor, home"
            >
              <Logo />
            </Link>
            <nav aria-label="Main" className="flex items-center gap-5">
              <ul className="flex gap-4 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/advisor?new">Get started</Link>
              </Button>
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="no-print mt-16 border-t bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-3">
              <Logo />
              <p className="max-w-sm text-muted-foreground">
                Rule-based scores from published books, official docs and developer surveys, each with its source and
                the date it was checked. A starting point for your own judgement, not a substitute for it.
              </p>
            </div>
            {footerColumns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h2 className="font-medium">{col.title}</h2>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t">
            <p className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
              <span>© 2026 Lochana Dahanayake</span>
              <Link href="/changelog" className="tabular-nums transition-colors hover:text-foreground">
                App v{APP_VERSION} · Knowledge base v{kb.meta.kbVersion}
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
