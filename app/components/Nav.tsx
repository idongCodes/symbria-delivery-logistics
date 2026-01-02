"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  PhoneIcon, 
  ArrowRightOnRectangleIcon 
} from "@heroicons/react/24/outline";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
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
    router.push("/");
    router.refresh();
  };

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
          
          {/* DESKTOP MENU (Hidden on Mobile) */}
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

          {/* MOBILE LOGIN BUTTON (Visible only on mobile when logged OUT) */}
          {!loggedIn && (
            <Link 
              href="/login" 
              className="md:hidden bg-white text-blue-800 px-3 py-1.5 rounded text-sm font-bold hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-200 dark:hover:bg-gray-700 transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* --- MOBILE FLOATING BOTTOM NAV (Visible only on mobile when logged IN) --- */}
      {loggedIn && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-blue-900/95 dark:bg-blue-950/95 backdrop-blur-md border border-blue-700 dark:border-blue-800 shadow-2xl rounded-2xl flex justify-between items-center px-6 py-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
          
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition">
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
          
          <Link href="/admin/feedback" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Feedback</span>
          </Link>
          
          <Link href="/contacts" className="flex flex-col items-center gap-1 text-blue-100 hover:text-white transition">
            <PhoneIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Contacts</span>
          </Link>
          
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-300 hover:text-red-100 transition">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Logout</span>
          </button>

        </div>
      )}
    </>
  );
}