export type BlogSection = {
  id: string;
  heading: string;
  paragraphs: readonly string[];
};

export type BlogPost = {
  slug: string;
  productId: "band" | "ring";
  title: string;
  description: string;
  excerpt: string;
  published: string;
  publishedIso: string;
  readingMinutes: number;
  points: readonly string[];
  sections: readonly BlogSection[];
  relatedSlug: string;
};

export const blogPosts: readonly BlogPost[] = [
  {
    slug: "how-the-fitness-band-tracks-activity",
    productId: "band",
    title: "How the Fitness Band tracks your activity",
    description:
      "The Fitness Band records steps, distance, and calories, then shows the day in the Joova app. Wellness readings only. No subscription.",
    excerpt:
      "A screenless band keeps steps, distance, and calories while you wear it. The Joova app shows the day, and the week, when you want to look.",
    published: "September 28, 2026",
    publishedIso: "2026-09-28",
    readingMinutes: 4,
    points: [
      "Steps, distance, and calories",
      "No screen on your wrist",
      "Sleep and heart-rate trends sit beside activity",
      "Up to 20–30 days per charge",
      "No subscription. Ever.",
    ],
    relatedSlug: "how-the-smart-ring-tracks-activity",
    sections: [
      {
        id: "what-it-tracks",
        heading: "What it tracks",
        paragraphs: [
          "The Fitness Band is a screenless tracker. Through the day it records steps, distance, and calories, then shows them in the Joova app. There is no display on the band, so you open the app when you want the details.",
          "Activity is one part of the picture. The same band also tracks how long and how well you sleep, plus heart-rate and HRV trends. Blood-oxygen readings are for general wellness, not a diagnosis.",
        ],
      },
      {
        id: "how-it-helps",
        heading: "How that helps",
        paragraphs: [
          "A step count is easier to use when you can see it later. The app keeps steps, movement, and time on your feet in one place. Week-over-week trends show a busier week or a quieter one, so you are not guessing from memory.",
          "Because the band has no screen, it stays out of the way while you walk, work, or sleep. You glance at your phone when you want the picture, not every few minutes on your wrist.",
          "Leaving it on is what makes the picture useful. The 55mAh battery lasts up to 20–30 days per charge, and about 45 days on standby. Battery life varies with settings and use. A full charge on the magnetic cable takes about 2 hours, so you are not plugging it in every night.",
        ],
      },
      {
        id: "how-to-wear-it",
        heading: "How to wear it",
        paragraphs: [
          "Charge the band before the first wear. Fasten the woven loop and silver buckle so the tracker sits flat. The strap fits wrists about 14–22 cm (5.5–8.7 in). Black, Blue, Green, Orange, and Red are the colors. The box includes 1 strap in the color you choose.",
          "The Joova app runs on iPhone with iOS 15 or later, and on Android 9 or later. The band works with Apple Health and Google Health Connect. Every feature in the app is included with the band. No subscription. Ever.",
          "The band is splash and rain resistant (1ATM). Take it off before swimming or showering, and dry it before you charge it.",
        ],
      },
      {
        id: "what-it-is",
        heading: "What it is for",
        paragraphs: [
          "The Fitness Band is for general wellness and fitness. It does not diagnose, treat, or detect disease. Tracker data is stored by the Joova app and is never sold.",
        ],
      },
    ],
  },
  {
    slug: "how-the-smart-ring-tracks-activity",
    productId: "ring",
    title: "How the Smart Ring tracks your activity",
    description:
      "The Smart Ring tracks steps and calories from your finger, with sleep and heart-rate readings in the same Joova app. Wellness only. No subscription.",
    excerpt:
      "The Smart Ring tracks steps and calories the same way the band does: quietly, in the Joova app, with no screen to check.",
    published: "September 28, 2026",
    publishedIso: "2026-09-28",
    readingMinutes: 4,
    points: [
      "Steps and calories",
      "Worn on a finger, with no screen",
      "Sleep, heart rate, and blood oxygen sit beside activity",
      "About 3 days per charge",
      "No subscription. Ever.",
    ],
    relatedSlug: "how-the-fitness-band-tracks-activity",
    sections: [
      {
        id: "what-it-tracks",
        heading: "What it tracks",
        paragraphs: [
          "The Smart Ring tracks daily activity as steps and calories. It also tracks sleep, heart rate, and blood oxygen. Blood-oxygen readings are for general wellness, not a diagnosis. There is no screen on the ring. The readings show up in the Joova app, the same app the Fitness Band uses.",
        ],
      },
      {
        id: "how-it-helps",
        heading: "How it helps, in the same way",
        paragraphs: [
          "Like the band, the ring keeps the day in the app so you can look when you want to. Steps and calories show how the day added up. Sleep and heart-rate readings sit beside that activity, so you are not looking at steps alone.",
          "You wear it on a finger instead of a wrist. The index finger gives the best readings. The middle or ring finger works well too. There is still no display to check in the middle of the day.",
          "Battery life is about 3 days in daily use from a 19mAh battery. Standby is 7–10 days. Battery life varies with settings and use. It charges on the dock that comes in the box, so a short charge covers a few days of wear.",
        ],
      },
      {
        id: "how-to-wear-it",
        heading: "How to wear it",
        paragraphs: [
          "The ring is stainless steel, in Silver, Black, or Rose Gold, and in Classic or Wave. Sizes run from US 7 to 12. A free sizing kit is available. Smart rings fit differently from jewelry, so a jewelry size is only a rough start.",
          "The Joova app runs on iPhone with iOS 15 or later, and on Android 9 or later. The ring syncs with Apple Health and Google Health Connect. Every feature in the app is included with the ring. No subscription. Ever.",
          "The ring is rated IP68 / 5ATM. You can wear it in the shower, the pool, and while washing dishes. Take it off for hot tubs, saunas, and diving.",
        ],
      },
      {
        id: "what-it-is",
        heading: "What it is for",
        paragraphs: [
          "The Smart Ring is for general wellness and fitness. It does not diagnose, treat, or detect disease. Tracker data is stored by the Joova app and is never sold.",
        ],
      },
    ],
  },
];

export function blogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
