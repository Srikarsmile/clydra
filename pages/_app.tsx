import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "sonner";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        {/* Mobile-optimized viewport - prevents zoom on input focus */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </ClerkProvider>
  );
}

export default MyApp;
