import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Geist_Mono } from "next/font/google";
import "../globals.css";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `try{var theme=localStorage.getItem("console-theme");document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(theme==="dark"?"dark":"light")}catch{}`;

export const metadata: Metadata = {
  title: "Hemia Console",
  description: "Consola operativa para administracion Hemia",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${sans.variable} ${geistMono.variable} light h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-full bg-background">{children}</body>
    </html>
  );
}
