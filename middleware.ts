import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { grantDailyTokens } from "./server/lib/grantDailyTokens"; // @grant-40k

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
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }

  // @grant-40k - Grant daily tokens to authenticated users (fire-and-forget)
  const { userId } = await auth();
  if (userId) {
    void grantDailyTokens(userId); // @grant-40k - runs in background
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
