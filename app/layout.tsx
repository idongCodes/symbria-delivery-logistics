import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AutoLogout from "./components/AutoLogout"; // 👈 1. Import this

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Symbria Delivery Logistics",
  description: "Delivery and Trip Logging System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 text-gray-900 pb-25`}>
        
        <AutoLogout /> {/* 👈 2. Add the component here */}
        
        <Nav />
        
        <main className="flex-grow w-full">
          {children}
        </main>
        
        <Footer />
        
      </body>
    </html>
  );
}