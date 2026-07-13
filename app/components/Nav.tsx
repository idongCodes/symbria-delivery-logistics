"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearImagesFromDB } from "@/app/lib/indexedDB";
import { 
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setLoggedIn(!!session);
      if (event === 'SIGNED_OUT') {
        router.push("/");
        router.refresh();
      }
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

  if (!loggedIn) {
    return null;
  }

  return (
    <>
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-blue-800 text-white shadow-md relative z-50 transition-colors">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          
          {/* LOGO */}
          <Link 
            href="/dashboard" 
            className="font-bold text-xl tracking-tight hover:text-blue-200 transition" 
          >
            Rx Delivery Logistics
          </Link>
          
          {/* UNIFIED MENU (Visible for both states) */}
          <div className="relative flex items-center" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="text-white hover:text-blue-200 transition p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Menu"
            >
              <EllipsisVerticalIcon className="w-7 h-7" />
            </button>
            
            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <Link 
                  href="/dashboard" 
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/contacts" 
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Contacts
                </Link>
                <button 
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition w-full"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}