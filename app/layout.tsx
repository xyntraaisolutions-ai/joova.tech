import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { CartProvider } from "@/components/layout/cart-provider";
import { SiteShell } from "@/components/layout/site-shell";
import { SITE_URL } from "@/content/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Joova Band — $49.99. No subscription. Ever.",
    template: "%s · Joova",
  },
  description:
    "Joova Band is a screenless fitness tracker. $49.99. No subscription. Ever. 3 straps in every box.",
  openGraph: {
    title: "Joova Band — No subscription. Ever.",
    description: "Screenless fitness tracker. $49.99. Three straps in every box.",
    url: SITE_URL,
    siteName: "Joova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joova Band",
    description: "$49.99. No subscription. Ever.",
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
      className={`${dmSans.variable} ${syne.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
