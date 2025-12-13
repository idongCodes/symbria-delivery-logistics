"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [supabase] = useState(() => createClient());

  const performLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push('/login');
    router.refresh();
  }, [router, supabase]);

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(Boolean(data?.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Auto-logout inactivity timer
  useEffect(() => {
    if (!loggedIn) return;

    const TIMEOUT_MS = 20 * 60 * 1000; 
    let timeoutId: NodeJS.Timeout;

    const handleInactivity = () => {
      console.log("User inactive for 20 mins. Auto logging out...");
      performLogout();
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivity, TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    resetTimer(); 
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [loggedIn, performLogout]);

  return (
    <nav className="p-5 bg-white border-b border-gray-200 flex justify-between items-center">
      <div className="font-bold text-lg text-blue-600">🚗 Symbria Delivery Logistics</div>
      <div className="space-x-4 flex items-center">
        {/* Dashboard/Home Toggle */}
        <Link 
          href={loggedIn ? "/dashboard" : "/"} 
          className="text-gray-600 hover:text-blue-500"
        >
          {loggedIn ? "Dashboard" : "Home"}
        </Link>
        
        {/* Contacts Link - ONLY visible if logged in */}
        {loggedIn && (
          <Link href="/contacts" className="text-gray-600 hover:text-blue-500">
            Contacts
          </Link>
        )}
        
        {/* Logout Button - ONLY visible if logged in */}
        {loggedIn && (
          <button
            onClick={performLogout}
            className="ml-4 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
