import { Link, Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { QrCode, ShieldCheck, WandSparkles } from 'lucide-react';
import { About } from '@/routes/About';
import { Generator } from '@/routes/Generator';

const NAV = [
  { to: '/', label: 'Generate', icon: WandSparkles },
  { to: '/about', label: 'Privacy', icon: ShieldCheck },
] as const;

function RootLayout() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <QrCode className="size-5 shrink-0" />
            QR
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">· made in your browser, sent nowhere</span>

          <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Generator,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({ routeTree, scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
