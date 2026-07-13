import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AutoLogout from "./components/AutoLogout";
import BackToTop from "./components/BackToTop";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rx Delivery Logistics",
  description: "Delivery and Trip Logging System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const isUnderConstruction = headersList.get("x-under-construction") === "true";

  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 text-gray-900`}>
        {!isUnderConstruction && <AutoLogout />}
        {!isUnderConstruction && <Nav />}
        <main className="flex-grow w-full">
          {children}
        </main>
        {!isUnderConstruction && <BackToTop />}
        {!isUnderConstruction && <Footer />}
      </body>
    </html>
  );
}
