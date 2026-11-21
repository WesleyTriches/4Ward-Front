import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "4Ward",
  description: "Encontre um fisioterapeuta e agende sua consulta",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-br" className={geistSans.variable}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
