import { grantDailyTokens } from "./server/lib/grantDailyTokens"; // @grant-80k
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/api-keys(.*)",
  "/api/analytics(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/terms",
  "/privacy",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Security filtering for common attack paths
  if (req.nextUrl.pathname.match(/^\/(?:wp|wordpress|phpmyadmin|xmlrpc\.php)/)) {
    return new Response('Not found', { status: 404 });
  }

  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }

  // @grant-80k - Grant daily tokens to authenticated users (fire-and-forget)
  const { userId } = await auth();
  if (userId) {
    void grantDailyTokens(userId); // @grant-80k - runs in background
  }
});

export const config = {
  matcher: "/:path*"
};
