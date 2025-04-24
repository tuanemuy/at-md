import { ThemeProvider } from "@/components/provider/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "@/lib/style/global.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME;
const description =
  "A blog service that manages articles in Markdown on GitHub and posts them to Bluesky.";

export const metadata: Metadata = {
  title: siteName,
  description,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL),
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#0586ff" showSpinner={false} />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
