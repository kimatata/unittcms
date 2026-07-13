import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match the root and all paths except Next.js internals, API routes, and static files.
  // This ensures next-intl middleware also handles paths with unsupported locale prefixes
  // (e.g. /whatever/projects) so they get redirected to the default locale.
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
