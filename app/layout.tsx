import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
        {/* --- START OF NAVBAR --- */}
	<nav className="p-5 bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="font-bold text-lg text-blue-600">
            🚗 Symbria Delivery Logistics
	  </div>
	  <div className="space-x-4">
            <Link href="/" className="text-gray-600 hover:text-blue-500">
              Home
	    </Link>
	    <Link href="/about" className="text-gray-600 hover:text-blue-500">
              About
	    </Link>
	  </div>
	</nav>
	{/* --- END OF NAVBAR --- */}

	{children}

      </body>
    </html>
  );
}
