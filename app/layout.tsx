import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Nav from "./components/Nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Symbria Delivery Logistics",
  description: "Manage RX driver deliverables and logistics",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={ inter.className }>
        {/* --- NAVBAR --- */}
        <Nav />
        {/* --- END NAVBAR --- */}

	{children}

      </body>
    </html>
  );
}
