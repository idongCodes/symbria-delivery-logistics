"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track Mobile Menu State
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setIsMenuOpen(false); // Close menu on logout
    router.push("/login");
    router.refresh();
  };

  // Helper to close menu when a link is clicked
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-blue-800 text-white shadow-md relative z-50">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="font-bold text-xl tracking-tight hover:text-blue-200 transition" onClick={closeMenu}>
          Symbria RX Logistics
        </Link>
        
        {/* --- DESKTOP MENU (Hidden on Mobile) --- */}
        <div className="hidden md:flex gap-6 text-sm font-medium items-center">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
              <Link href="/contacts" className="hover:text-blue-200 transition">Contacts</Link>
              <button onClick={handleLogout} className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-gray-100 transition">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 transition">
              Login
            </Link>
          )}
        </div>

        {/* --- MOBILE HAMBURGER BUTTON (Visible only on Mobile) --- */}
        <button 
          className="md:hidden p-2 text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            /* Close (X) Icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Hamburger (3 Lines) Icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* --- MOBILE MENU DROPDOWN --- */}
      {/* This sits absolutely below the navbar when open */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-blue-900 border-t border-blue-700 shadow-xl flex flex-col p-4 gap-4 text-center animate-in slide-in-from-top-2 fade-in duration-200">
          {loggedIn ? (
            <>
              <Link href="/dashboard" onClick={closeMenu} className="block py-2 hover:bg-blue-800 rounded transition">
                Dashboard
              </Link>
              <Link href="/contacts" onClick={closeMenu} className="block py-2 hover:bg-blue-800 rounded transition">
                Contacts
              </Link>
              <button 
                onClick={handleLogout} 
                className="block w-full bg-white text-blue-900 font-bold py-3 rounded mt-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              onClick={closeMenu} 
              className="block w-full bg-white text-blue-900 font-bold py-3 rounded hover:bg-gray-100"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
