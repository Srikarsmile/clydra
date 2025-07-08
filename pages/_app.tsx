import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@clerk/nextjs";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { logger } from "../lib/logger";
import "../styles/globals.css";

// Import KaTeX CSS globally for math rendering
import "katex/dist/katex.min.css";

// @performance - Web Vitals tracking
function reportWebVitals(metric: { name: string; value: number }) {
  // Log using structured logger
  logger.info("Web Vitals metric", {
    metric: metric.name,
    value: metric.value,
    type: "performance"
  });

  // Send to analytics in production
  if (process.env.NODE_ENV === "production") {
    // You can send to your analytics service here
    // Example: gtag('event', metric.name, { value: metric.value });
  }
}

// Component for route logging within ClerkProvider
function RouteLogger() {
  const router = useRouter();
  const { userId } = useAuth();

  // Route logging for real users
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.info("route", { uid: userId, path: router.pathname });
    }
  }, [router.pathname, userId]);

  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // @performance - Performance monitoring
  useEffect(() => {
    // Track page load performance
    if (typeof window !== "undefined" && window.performance) {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;

        logger.info("Page performance metrics", {
          loadTime,
          domContentLoaded,
          type: "performance",
          page: router.asPath
        });
      }
    }
  }, [router.asPath]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('App-level error boundary triggered', error, {
          component: 'MyApp',
          componentStack: errorInfo.componentStack || undefined,
          page: router?.asPath
        });
      }}
    >
      <ClerkProvider {...pageProps}>
        <Head>
          {/* Mobile-optimized viewport - prevents zoom on input focus */}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
          />
          {/* @performance - Preload critical resources */}
          <link
            rel="preload"
            href="/fonts/inter.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        </Head>
        <RouteLogger />
        <Component {...pageProps} />
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </ClerkProvider>
    </ErrorBoundary>
  );
}

// @performance - Export Web Vitals function
export { reportWebVitals };
export default MyApp;
