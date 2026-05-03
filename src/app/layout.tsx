import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const title = Cinzel({ subsets: ["latin"], variable: "--font-title", weight: ["400", "600", "700"] });
const body = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Deities and Demigods",
  description: "A dark fantasy AI-powered mythic RPG."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${title.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
