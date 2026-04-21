"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearImagesFromDB } from "@/app/lib/indexedDB";
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  PhoneIcon, 
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { useRef } from "react";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    };
    
    // Check immediately
    checkUser();

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    localStorage.removeItem("tripLogFormState");
    clearImagesFromDB();
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  const showBottomNav = loggedIn && pathname !== "/login";

  return (
    <>
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-blue-800 dark:bg-blue-950 text-white shadow-md relative z-50 transition-colors">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          
          {/* LOGO */}
          <Link 
            href="/" 
            className="font-bold text-xl tracking-tight hover:text-blue-200 transition" 
          >
            Symbria RX Logistics
          </Link>
          
          {/* DESKTOP MENU (Visible only when logged IN) */}
          <div className="hidden md:flex gap-6 text-sm font-medium items-center">
            {loggedIn && (
              <>
                <Link href="/trip-log" className="hover:text-blue-200 transition">Trip Log</Link>
                <Link href="/admin/feedback" className="hover:text-blue-200 transition">Feedback</Link>
                <button onClick={handleLogout} className="bg-white text-blue-800 px-3 py-1 rounded hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 transition">
                  Logout
                </button>
                <Link href="/contacts" className="hover:text-blue-200 transition">Contacts</Link>
              </>
            )}
          </div>

          {/* UNAUTHENTICATED MENU (Visible for unauthenticated users, both desktop and mobile) */}
          {!loggedIn && (
            <div className="relative flex items-center" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="text-white hover:text-blue-200 transition p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Menu"
              >
                <EllipsisVerticalIcon className="w-7 h-7" />
              </button>
              
              {menuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <Link 
                    href="/trip-log" 
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Complete Pre/Post-Trip
                  </Link>
                  <Link 
                    href="/login" 
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Admin Login
                  </Link>
                  <Link 
                    href="/contacts" 
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Contacts
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* --- MOBILE FLOATING BOTTOM NAV (Visible only on mobile when logged IN) --- */}
      {showBottomNav && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit min-w-[40%] bg-blue-900/80 dark:bg-blue-950/80 backdrop-blur-md border border-blue-700 dark:border-blue-800 shadow-2xl rounded-full flex justify-between items-center px-6 py-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500 whitespace-nowrap">
          
          <Link href="/trip-log" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition group">
            <HomeIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Trip Log</span>
          </Link>
          
          <Link href="/admin/feedback" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition group">
            <ChatBubbleLeftRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Feedback</span>
          </Link>
          
          <Link href="/contacts" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition group">
            <PhoneIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Contacts</span>
          </Link>
          
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-300 hover:text-red-100 transition group">
            <ArrowRightOnRectangleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>

        </div>
      )}
    </>
  );
}