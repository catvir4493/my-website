import { ImageResponse } from "next/og";
import { SocialImage } from "@/components/projects/social-image";
export const alt = "Marcell.OS — Computer Engineering at BME";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <SocialImage
      title="Marcell. Built to think ahead."
      category="COMPUTER ENGINEERING / BME"
      summary="Software, computer vision systems, algorithms and experimental technology."
    />,
    size,
  );
}
