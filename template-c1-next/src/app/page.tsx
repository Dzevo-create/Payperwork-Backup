"use client";

import { C1Chat } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";
import { Theme, themePresets } from "@crayonai/react-ui";

export type ThemeFont =
  | "Inter"
  | "Roboto"
  | "Plus Jakarta Sans"
  | "Open Sans"
  | "Bitter"
  | "Merriweather"
  | "Playfair Display"
  | "Crimson Text"
  | "Geist"
  | "Figtree"
  | "Manrope"
  | "Work Sans"
  | "DM Sans"
  | "IBM Plex Serif"
  | "Space Mono"
  | "Geist Mono"
  | "Host Grotesk";

const generateTypography = () => ({
  fontPrimary: `400 16px/20px Geist`,
  fontHeadingLarge: `600 28px/32.2px Geist`,
  fontHeadingMedium: `600 24px/27.6px Geist`,
  fontHeadingSmall: `500 18px/22.5px Geist`,
  fontTitle: `500 16px/20px Geist`,
  fontTitleMedium: `500 16px/20px Geist`,
  fontTitleSmall: `500 16px/20px Geist`,
  fontBody: `400 16px/24px Geist`,
  fontBodyLargeHeavy: `500 18px/27px Geist`,
  fontBodyLarge: `400 18px/27px Geist`,
  fontBodyMedium: `400 16px/20px Geist`,
  fontBodySmall: `400 14px/21px Geist`,
  fontBodyHeavy: `500 16px/24px Geist`,
  fontBodySmallHeavy: `600 16px/20px Geist`,
  fontBodyLink: `500 16px/24px Geist`,
  fontLabelLarge: `400 16px/19.2px Geist`,
  fontLabelLargeHeavy: `500 16px/19.2px Geist`,
  fontLabel: `400 14px/16.8px Geist`,
  fontLabelHeavy: `500 14px/16.8px Geist`,
  fontLabelMedium: `400 16px/20px Geist`,
  fontLabelMediumHeavy: `600 16px/20px Geist`,
  fontLabelSmall: `400 12px/14.4px Geist`,
  fontLabelSmallHeavy: `500 12px/14.4px Geist`,
  fontLabelExtraSmall: `400 10px/12px Geist`,
  fontLabelExtraSmallHeavy: `500 10px/12px Geist`,
  shadowS: "0px 1px 2px rgba(0, 0, 0, 0.04)",
  shadowM: "0px 4px 6px rgba(0, 0, 0, 0.04)",
  shadowL: "0px 1px 8px rgba(0, 0, 0, 0.08)",
  shadowXl: "0px 10px 15px rgba(0, 0, 0, 0.1)",
});

const theme = {
  ...themePresets.neon.darkTheme,
  ...generateTypography(),
};

export default function Home() {
  return <C1Chat apiUrl="/api/chat" theme={{ theme }} />;
}
