import type { Metadata } from "next";
import { Navbar } from "@components/navbar";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Mood changing Cafe",
  description: "An innovative cafe experience where your mood shapes your menu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <>
   <Analytics />
   <Navbar />
   {children}
   </>
  );
}
