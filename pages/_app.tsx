import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </ClerkProvider>
  );
}

export default MyApp;
