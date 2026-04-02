import type { Metadata } from "next";
import { Cinzel_Decorative, Uncial_Antiqua, Almendra, Grenze_Gotisch } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Fantasy Font 1: Elegant Medieval - For titles and main headers
const cinzel = Cinzel_Decorative({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

// Fantasy Font 2: Celtic Calligraphic - For character names and labels
const uncial = Uncial_Antiqua({
  variable: "--font-uncial",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Fantasy Font 3: Classic Fantasy Book - For narrative text
const almendra = Almendra({
  variable: "--font-almendra",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Fantasy Font 4: Gothic Blackletter - For dramatic moments
const grenze = Grenze_Gotisch({
  variable: "--font-grenze",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DEITIES & DEMIGODS — Mythworld Engine",
  description: "AI-powered D&D campaign engine featuring heroes, gods, and monsters from the TSR Deities & Demigods 1980 rulebook.",
  keywords: ["D&D", "Dungeons & Dragons", "Deities & Demigods", "TSR", "Mythology", "RPG", "Campaign"],
  authors: [{ name: "Mythworld Engine" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DEITIES & DEMIGODS — Mythworld Engine",
    description: "AI-powered D&D campaign with legendary heroes and gods",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${uncial.variable} ${almendra.variable} ${grenze.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
