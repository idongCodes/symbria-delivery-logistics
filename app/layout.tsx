import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import Nav from "./components/Nav";
// import Footer from "./components/Footer";
// import AutoLogout from "./components/AutoLogout";
import NotFound from "./not-found";

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
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 text-gray-900`}>
        
        {/* Temporarily intercepting the app with our 404 page */}
        <NotFound />
        
        {/* 
          Next.js requires the children prop to be rendered in the root layout. 
          We hide it here so the rest of the app is completely hidden behind the 404 page.
        */}
        <div className="hidden">
          {/* <AutoLogout /> */}
          {/* <Nav /> */}
          <main className="flex-grow w-full">
            {children}
          </main>
          {/* <Footer /> */}
        </div>
        
      </body>
    </html>
  );
}
