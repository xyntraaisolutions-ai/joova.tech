import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/layout/auth-provider";
import { CartProvider } from "@/components/layout/cart-provider";
import { WishlistProvider } from "@/components/layout/wishlist-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { SITE_URL, siteDescription } from "@/content/site";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Joova — No subscription. Ever.",
    template: "%s · Joova",
  },
  description: siteDescription,
  openGraph: {
    title: "Joova — No subscription. Ever.",
    description: siteDescription,
    url: SITE_URL,
    siteName: "Joova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joova",
    description: siteDescription,
  },
};

const themeBoot = `(function(){try{var t=localStorage.getItem("joova-theme");if(t!=="day"&&t!=="night"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"night":"day"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <SiteShell>{children}</SiteShell>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
