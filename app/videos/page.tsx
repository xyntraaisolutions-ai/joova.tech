import type { Metadata } from "next";
import { VideoLibrary } from "@/components/videos/video-library";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch Joova product videos. Filter by Fitness Band, Smart Ring, and the rest of the lineup.",
};

export default function VideosPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Videos
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Watch a product, then open its page. Playback starts muted. Turn sound on in the player if you want it.
      </p>
      <VideoLibrary />
    </Container>
  );
}
