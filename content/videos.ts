export type ProductVideo = {
  id: string;
  productId: string;
  title: string;
  youtubeId: string;
  src?: string;
  poster?: string;
};

export const productVideos: readonly ProductVideo[] = [
  {
    id: "band-intro",
    productId: "band",
    title: "Joova Band",
    youtubeId: "_UIL2avJd-4",
  },
  {
    id: "ring-intro",
    productId: "ring",
    title: "Smart Ring",
    youtubeId: "g5u0vixrK1Q",
  },
];
