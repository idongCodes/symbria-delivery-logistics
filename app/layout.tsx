import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer"; // Import the new Footer

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
      {/* flex flex-col min-h-screen:
        These classes force the body to take up at least 100% of the screen height,
        allowing 'mt-auto' in the Footer to push it to the very bottom.
      */}
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 text-gray-900`}>
        
        {/* Navigation stays at the top */}
        <Nav />
        
        {/* Main Content grows to fill available space */}
        <main className="flex-grow w-full">
          {children}
        </main>
        
        {/* Footer stays at the bottom */}
        <Footer />
        
      </body>
    </html>
  );
}
