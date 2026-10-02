export type NavKind = "link" | "menu" | "products";

export type NavItem = {
  id: string;
  area: "header" | "footer";
  parentId: string | null;
  kind: NavKind;
  label: string;
  href: string;
  sort: number;
};

export const navItems: readonly NavItem[] = [
  { id: "header-shop", area: "header", parentId: null, kind: "link", label: "Shop", href: "/shop", sort: 0 },
  { id: "header-deals", area: "header", parentId: null, kind: "link", label: "Deals", href: "/deals", sort: 1 },
  { id: "header-products", area: "header", parentId: null, kind: "products", label: "Products", href: "/shop", sort: 2 },
  { id: "header-videos", area: "header", parentId: null, kind: "link", label: "Videos", href: "/videos", sort: 3 },
  { id: "header-blog", area: "header", parentId: null, kind: "link", label: "Blogs", href: "/blog", sort: 4 },
  { id: "header-about", area: "header", parentId: null, kind: "link", label: "About", href: "/about", sort: 5 },
  { id: "header-support", area: "header", parentId: null, kind: "menu", label: "Support", href: "/help", sort: 6 },
  { id: "header-support-help", area: "header", parentId: "header-support", kind: "link", label: "FAQs", href: "/help", sort: 0 },
  { id: "header-support-contact", area: "header", parentId: "header-support", kind: "link", label: "Contact Us", href: "/contact", sort: 1 },
  { id: "header-support-app", area: "header", parentId: "header-support", kind: "link", label: "APP Download", href: "/app", sort: 2 },
  { id: "footer-customer", area: "footer", parentId: null, kind: "menu", label: "Customer", href: "", sort: 0 },
  { id: "footer-reviews", area: "footer", parentId: "footer-customer", kind: "link", label: "Reviews", href: "/reviews", sort: 0 },
  { id: "footer-track", area: "footer", parentId: "footer-customer", kind: "link", label: "Track order", href: "/track", sort: 1 },
  { id: "footer-warranty", area: "footer", parentId: "footer-customer", kind: "link", label: "Warranty", href: "/warranty", sort: 2 },
  { id: "footer-legal", area: "footer", parentId: null, kind: "menu", label: "Legal", href: "", sort: 1 },
  { id: "footer-privacy", area: "footer", parentId: "footer-legal", kind: "link", label: "Privacy", href: "/privacy", sort: 0 },
  { id: "footer-terms", area: "footer", parentId: "footer-legal", kind: "link", label: "Terms", href: "/terms", sort: 1 },
  { id: "footer-accessibility", area: "footer", parentId: "footer-legal", kind: "link", label: "Accessibility", href: "/accessibility", sort: 2 },
];
