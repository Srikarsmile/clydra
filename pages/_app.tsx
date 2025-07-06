import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "sonner";
import { useEffect } from "react";
import "../styles/globals.css";

// @performance - Web Vitals tracking
function reportWebVitals(metric: { name: string; value: number }) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === "production") {
    // You can send to your analytics service here
    // Example: gtag('event', metric.name, { value: metric.value });
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  // @performance - Enhanced mobile performance monitoring
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

        if (process.env.NODE_ENV === "development") {
          console.log(`[Performance] Page load time: ${loadTime}ms`);
          console.log(
            `[Performance] DOM content loaded: ${domContentLoaded}ms`
          );
        }
      }
    }

    // @mobile-optimization - Disable pull-to-refresh on mobile
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return; // Allow normal scrolling on inputs
      }
      
      if (window.scrollY === 0) {
        e.preventDefault();
      }
    };

    // @mobile-optimization - Prevent double-tap zoom
    const preventDoubleTapZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // @mobile-optimization - Optimize touch responsiveness
    const optimizeTouchResponsiveness = () => {
      document.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });
      document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
      
      // Add touch-action CSS property to body
      document.body.style.touchAction = 'pan-y pinch-zoom';
    };

    // @mobile-optimization - Detect and optimize for mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      optimizeTouchResponsiveness();
    }

    // @performance - Memory cleanup
    return () => {
      document.removeEventListener('touchstart', preventDoubleTapZoom);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  return (
    <ClerkProvider {...pageProps}>
      <Head>
        {/* @mobile-optimization - Enhanced mobile viewport configuration */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no"
        />
        
        {/* @mobile-optimization - iOS Safari optimizations */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clydra" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        
        {/* @mobile-optimization - Prevent mobile zoom and improve touch */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* @performance - Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* @performance - Preconnect to external services */}
        <link rel="preconnect" href="https://openrouter.ai" />
        <link rel="preconnect" href="https://api.kluster.ai" />
        <link rel="preconnect" href="https://api.sarvam.ai" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* @mobile-optimization - PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* @performance - Resource hints for faster loading */}
        <link rel="dns-prefetch" href="https://clerk.com" />
        <link rel="dns-prefetch" href="https://supabase.com" />
      </Head>
      <Component {...pageProps} />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        duration={4000}
        toastOptions={{
          style: {
            fontSize: '14px',
            padding: '12px 16px',
          },
        }}
      />
    </ClerkProvider>
  );
}

export { reportWebVitals };
export default MyApp;
