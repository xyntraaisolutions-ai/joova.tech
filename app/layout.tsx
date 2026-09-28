import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { CartProvider } from "@/components/layout/cart-provider";
import { WishlistProvider } from "@/components/layout/wishlist-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { SITE_URL, siteDescription } from "@/content/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3ee",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Joova — Smarter Tech | Bigger Tomorrow",
    template: "%s · Joova",
  },
  description: siteDescription,
  openGraph: {
    title: "Joova — Smarter Tech | Bigger Tomorrow",
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
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <CartProvider>
          <WishlistProvider>
            <SiteShell>{children}</SiteShell>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
