import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/layout/auth-provider";
import { CartProvider } from "@/components/layout/cart-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteContentProvider } from "@/components/layout/site-content";
import { loadContentBundle } from "@/lib/content/load";
import "./globals.css";

export const revalidate = 60;

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadContentBundle();
  return {
    metadataBase: new URL(site.siteUrl),
    title: {
      default: "Joova — No subscription. Ever.",
      template: "%s · Joova",
    },
    description: site.siteDescription,
    openGraph: {
      title: "Joova — No subscription. Ever.",
      description: site.siteDescription,
      url: site.siteUrl,
      siteName: "Joova",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Joova",
      description: site.siteDescription,
    },
  };
}

const themeBoot = `(function(){try{var t=localStorage.getItem("joova-theme");if(t!=="day"&&t!=="night"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"night":"day"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await loadContentBundle();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <SiteContentProvider value={site}>
        <AuthProvider>
          <CartProvider>
            <SiteShell>{children}</SiteShell>
          </CartProvider>
        </AuthProvider>
        </SiteContentProvider>
      </body>
    </html>
  );
}
