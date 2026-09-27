export const appOptions = [
  {
    id: "A",
    title: "Factory's generic app",
    phase: "Not the launch path",
    launch: false,
    summary:
      "Customers download the factory's own app, under a different name from Joova.",
    time: "Ready now",
    good: "Available immediately.",
    bad: "The name can confuse buyers. The listing, reviews, and data stay with the factory.",
  },
  {
    id: "B",
    title: "White-label Joova app",
    phase: "Launch · Phases 1–2",
    launch: true,
    summary:
      "The factory's app rebuilt with the Joova name, icon, colors, and text, published under Joova's developer accounts.",
    time: "4–8 weeks",
    good: "It looks like Joova's own app. Joova owns the listing and the reviews. The factory maintains it.",
    bad: "Features stay within what the factory's app already does.",
  },
  {
    id: "C",
    title: "Joova's own app on the factory SDK",
    phase: "Phase 3",
    launch: false,
    summary:
      "Joova's tech team builds a new app on top of the factory's software kit, and adds features from there. The contract needs the SDK and code rights.",
    time: "4–6 months",
    good: "Full control of design, features, and data. Joova can switch factories later.",
    bad: "The contract has to include SDK and code rights before the team can build on it.",
  },
] as const;
