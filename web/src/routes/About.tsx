import { Ban, Bot, Cpu, GitFork, HardDrive, Hash, Heart, Link2Off, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REPO_URL, STATIC_BUILD } from '@/lib/project';

const SEARCH_URL = 'https://www.google.com/search?q=qr+code+generator';

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="text-foreground underline underline-offset-2 hover:no-underline">
      {children}
    </a>
  );
}

const PRIVACY: { icon: LucideIcon; title: string; body: ReactNode }[] = [
  {
    icon: Cpu,
    title: 'Made in your browser',
    body: 'Encoding, drawing, PNG export and the “Scans correctly” check all run on this page. There is no server endpoint that accepts what you type.',
  },
  {
    icon: Ban,
    title: 'The browser enforces it',
    body: (
      <>
        The page carries a Content-Security-Policy of <code className="text-foreground">connect-src 'none'</code>, which
        blocks every fetch, XHR, WebSocket and beacon. No script here, ours or a dependency’s, can send anything anywhere.
        No CDNs, web fonts, analytics or tracking codes.
      </>
    ),
  },
  {
    icon: Link2Off,
    title: 'No redirects',
    body: 'The code holds exactly the text you entered, not a short link that someone else can count, change or switch off.',
  },
  {
    icon: Hash,
    title: 'Links only when you ask',
    body: `“Share link” copies a URL with the content and style as query parameters, and puts it in the address bar. Until you press it, the address bar holds nothing but the page. A shared link lands in browser history, and opening one sends the whole URL to whoever hosts the page. ${
      STATIC_BUILD
        ? 'This copy is hosted on GitHub Pages, so GitHub’s logging applies.'
        : 'This server logs paths only, never the query string.'
    } Logos are never included.`,
  },
  {
    icon: HardDrive,
    title: 'What is stored',
    body: 'Style settings and saved presets live in this browser’s local storage. Content is stored only if you turn on “Remember content”. Logos stay in memory until you reload.',
  },
];

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2 sm:pb-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

export function About() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">About</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A QR code generator that works entirely in your browser. No account, no tracking codes, no analytics.
        </p>
      </div>

      <Section icon={Heart} title="Why">
        <p>
          Inspired by the <A href={SEARCH_URL}>top results for “qr code generator”</A>, which are mostly sign-up funnels.
          Many encode their own short link instead of yours, so they can count your scans, and the code stops working when
          the trial ends. This one encodes what you type and never sees it.
        </p>
      </Section>

      <Card>
        <CardHeader className="pb-2 sm:pb-2">
          <CardTitle className="text-sm">How it stays private</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {PRIVACY.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{title}.</span> {body}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Section icon={GitFork} title="Source">
        <p>
          Open source under the MIT licence: <A href={REPO_URL}>{REPO_URL.replace('https://', '')}</A>. Run it yourself
          with Docker or host the static build anywhere. Pull requests are welcome within reason, or fork it and make it
          yours.
        </p>
        <p>
          QR encoding is Project Nayuki’s <A href="https://github.com/nayuki/QR-Code-generator">QR Code generator
          library</A> (MIT), vendored unchanged. The scan check uses <A href="https://github.com/cozmo/jsQR">jsQR</A>{' '}
          (Apache 2.0). Built with React, TanStack Router, Base UI, Tailwind CSS, Lucide icons and Hono.
        </p>
      </Section>

      <Section icon={Bot} title="Made by robots">
        <p>
          Every line of this app, this page included, was written by AI (Claude, using Claude Code). A human directed
          it and tested it.
        </p>
      </Section>
    </div>
  );
}
