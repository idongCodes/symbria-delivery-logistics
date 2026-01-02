"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  PhoneIcon, 
  ArrowRightOnRectangleIcon, 
  ArrowLeftOnRectangleIcon 
} from "@heroicons/react/24/outline";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false); 
    router.push("/");
    router.refresh();
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-blue-800 dark:bg-blue-950 text-white shadow-md relative z-50 transition-colors">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        
        {/* LOGO - Always redirects to Home */}
        <Link 
          href="/" 
          className="font-bold text-xl tracking-tight hover:text-blue-200 transition" 
          onClick={closeMenu}
        >
          Symbria RX Logistics
        </Link>
        
        {/* --- DESKTOP MENU --- */}
        <div className="hidden md:flex gap-6 text-sm font-medium items-center">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
              <Link href="/admin/feedback" className="hover:text-blue-200 transition">Feedback</Link>
              <Link href="/contacts" className="hover:text-blue-200 transition">Contacts</Link>
              <button onClick={handleLogout} className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 transition">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 transition">
              Login
            </Link>
          )}
        </div>

        {/* --- MOBILE HAMBURGER BUTTON --- */}
        <button 
          className="md:hidden p-2 text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* --- MOBILE MENU (Floating Bottom Bar) --- */}
      {isMenuOpen && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-blue-900/95 dark:bg-blue-950/95 backdrop-blur-sm border border-blue-700 dark:border-blue-800 shadow-2xl rounded-2xl flex flex-col p-4 gap-3 text-center animate-in slide-in-from-bottom-4 fade-in duration-300">
          {loggedIn ? (
            <>
              <Link 
                href="/dashboard" 
                onClick={closeMenu} 
                className="flex items-center justify-center gap-3 py-3 hover:bg-blue-800 dark:hover:bg-blue-900 rounded-xl transition"
              >
                <HomeIcon className="w-5 h-5" />
                <span className="font-semibold">Dashboard</span>
              </Link>
              
              <Link 
                href="/admin/feedback" 
                onClick={closeMenu} 
                className="flex items-center justify-center gap-3 py-3 hover:bg-blue-800 dark:hover:bg-blue-900 rounded-xl transition"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="font-semibold">Feedback</span>
              </Link>
              
              <Link 
                href="/contacts" 
                onClick={closeMenu} 
                className="flex items-center justify-center gap-3 py-3 hover:bg-blue-800 dark:hover:bg-blue-900 rounded-xl transition"
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="font-semibold">Contacts</span>
              </Link>
              
              <div className="h-px bg-blue-800 dark:bg-blue-900 my-1 mx-4"></div>

              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-3 w-full bg-white text-blue-900 font-bold py-3 rounded-xl mt-1 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 shadow-sm"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              onClick={closeMenu} 
              className="flex items-center justify-center gap-3 w-full bg-white text-blue-900 font-bold py-3 rounded-xl hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 shadow-sm"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}