import type { BlogPost } from "@/content/blog";
import type { NavItem } from "@/content/nav";
import type { CatalogCategoryId, CatalogProduct, Deal } from "@/content/catalog";
import type { PageCopy } from "@/content/page-copy";
import type { BandVariant, NoticeBackground, NoticeFontColor, RingVariant } from "@/content/site";
import type { ProductVideo } from "@/content/videos";

export type SupportChannel = {
  id: string;
  label: string;
  reply: string;
  href?: string;
};

export type ContentBundle = {
  siteUrl: string;
  market: { code: string; name: string; currency: string };
  markets: { code: string; name: string; currency: string }[];
  logo: { url: string; width: number; height: number } | null;
  company: {
    brand: string;
    product: string;
    legalName: string;
    copyright: string;
    address: string;
    email: string;
    supportHours: string;
  };
  policies: {
    returnsTitle: string;
    strapTitle: string;
    dockTitle: string;
    heroLine: string;
    strapSummary: string;
    dockSummary: string;
    shipping: string;
    outsideUsNotice: string;
    returnsSummary: string;
    warrantyRegistration: string;
    accountSummary: string;
  };
  announcement: string;
  notices: {
    development: { text: string; enabled: boolean; color: NoticeFontColor; background: NoticeBackground };
    shipping: { text: string; enabled: boolean; color: NoticeFontColor; background: NoticeBackground };
  };
  headerSlogan: string;
  footerBlurb: string;
  footerMarketplaces: string;
  storeLinks: { id: string; label: string; href: string }[];
  siteDescription: string;
  noSubscription: string;
  supportMenu: { href: string; label: string }[];
  navItems: NavItem[];
  support: {
    email: string;
    promise: string;
    channels: SupportChannel[];
  };
  catalog: CatalogProduct[];
  catalogCategories: {
    id: CatalogCategoryId;
    label: string;
    href: string;
    summary: string;
  }[];
  deals: Deal[];
  featuredProducts: CatalogProduct[];
  socialLinks: { id: "facebook" | "instagram" | "youtube" | "tiktok" | "pinterest" | string; label: string; href: string }[];
  paymentMethods: { id: string; label: string }[];
  blogPosts: BlogPost[];
  productVideos: ProductVideo[];
  helpArticles: { slug: string; title: string; summary: string; body: string }[];
  bandVariants: BandVariant[];
  ringVariants: RingVariant[];
  watchVariants: {
    id: string;
    name: string;
    image: string;
    alt: string;
  }[];
  prices: {
    band: number;
    ring: number;
    share: number;
    straps: number;
    glasses: number;
    buds: number;
    watch: number;
  };
  priceLabels: {
    band: string;
    ring: string;
    share: string;
    straps: string;
    glasses: string;
    buds: string;
    watch: string;
  };
  faqs: { q: string; a: string }[];
  specs: { label: string; value: string }[];
  bandFeatures: { title: string; detail: string }[];
  ringFeatures: { title: string; detail: string }[];
  ringFacts: { label: string; value: string }[];
  ringFaqs: { q: string; a: string }[];
  watchFeatures: { title: string; detail: string }[];
  watchFacts: { label: string; value: string }[];
  watchFaqs: { q: string; a: string }[];
  glassesFeatures: { title: string; detail: string }[];
  glassesFacts: { label: string; value: string }[];
  glassesFaqs: { q: string; a: string }[];
  budsFeatures: { title: string; detail: string }[];
  budsFacts: { label: string; value: string }[];
  budsFaqs: { q: string; a: string }[];
  shareBuds: { name: string; detail: string }[];
  shareFacts: { label: string; value: string }[];
  dayStory: { id: string; title: string; copy: string; metric: string }[];
  appScreens: { id: string; title: string; copy: string }[];
  trustItems: { title: string; href: string; copy: string }[];
  inTheBox: string[];
  useSteps: string[];
  careNotes: { title: string; body: string }[];
  boxFacts: { label: string; value: string }[];
  batteryFacts: { label: string; value: string }[];
  ringSizes: number[];
  calculatorDefaultMonthly: number;
  pageCopy: PageCopy;
};
