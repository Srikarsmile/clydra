import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "sonner";
import { useEffect } from "react";
import "../styles/globals.css";

// @performance - Web Vitals tracking
function reportWebVitals(metric: { name: string; value: number }) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // You can send to your analytics service here
    // Example: gtag('event', metric.name, { value: metric.value });
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  // @performance - Performance monitoring
  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] Page load time: ${loadTime}ms`);
          console.log(`[Performance] DOM content loaded: ${domContentLoaded}ms`);
        }
      }
    }
  }, []);

  return (
    <ClerkProvider {...pageProps}>
      <Head>
        {/* Mobile-optimized viewport - prevents zoom on input focus */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        {/* @performance - Preload critical resources */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </ClerkProvider>
  );
}

// @performance - Export Web Vitals function
export { reportWebVitals };
export default MyApp;
