import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlexGain — Build the body you came for",
  description:
    "Training, fuel and progress — one sharp view. FlexGain is a workout progress tracker for lifters, calisthenics athletes and anyone serious about getting stronger.",
  metadataBase: new URL("https://flexgain.local"),
  openGraph: {
    title: "FlexGain — Build the body you came for",
    description:
      "Training, fuel and progress — one sharp view.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
