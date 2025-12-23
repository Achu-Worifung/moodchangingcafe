import type { Metadata } from "next";
import { Navbar } from "@components/navbar";

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
   <Navbar />
   {children}
   </>
  );
}
