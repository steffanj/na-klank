import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Na-klank",
  description: "Een persoonlijk eerbetoon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${lora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-serif">{children}</body>
    </html>
  );
}
