import { Ban, Cpu, EyeOff, Hash, HardDrive, Link2Off } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const POINTS = [
  {
    icon: Cpu,
    title: 'Made in your browser',
    body: 'Encoding and drawing both happen on this page, with a vendored copy of Nayuki’s QR library and a renderer written for this app. The server only hands over the page itself. It has no endpoint that accepts what you type.',
  },
  {
    icon: Ban,
    title: 'The browser enforces it',
    body: 'The page is served with a Content-Security-Policy of connect-src \'none\'. That blocks every fetch, XHR, WebSocket and beacon, so no script on this page, ours or a dependency’s, can send anything anywhere. There are no CDNs, web fonts or analytics.',
  },
  {
    icon: Link2Off,
    title: 'No redirects',
    body: 'The code holds exactly the text you entered. Hosted generators often encode their own short link instead, so they can count scans, change where it points, or stop it working when a subscription ends. This one does not, and cannot.',
  },
  {
    icon: Hash,
    title: 'Every code has a URL',
    body: 'The address bar keeps the content and style as readable query parameters, so any URL you copy recreates the code, and ?url=… seeds the input. That means content sits in your browser history. The server logs paths only, never the query string, and Traefik keeps no access log. Logos are never included.',
  },
  {
    icon: HardDrive,
    title: 'What is stored',
    body: 'Your style settings and saved presets live in this browser’s local storage. Content is stored only if you turn on “Remember content”. Logos are held in memory and are gone when you reload.',
  },
  {
    icon: EyeOff,
    title: 'The scan check is local too',
    body: 'The “Scans correctly” badge comes from rendering the code and decoding it again with jsQR, in this tab.',
  },
];

export function About() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Privacy</h1>
        <p className="mt-1 text-sm text-muted-foreground">What this generator does with what you type: nothing that leaves this tab.</p>
      </div>
      {POINTS.map(({ icon: Icon, title, body }) => (
        <Card key={title}>
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2 sm:pb-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
        </Card>
      ))}
    </div>
  );
}
