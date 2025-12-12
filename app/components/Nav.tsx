"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname(); // Helpful to know where we are
  const [loggedIn, setLoggedIn] = useState(false);
  // Create client once
  const [supabase] = useState(() => createClient());

  // Shared Logout Logic
  const performLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push('/login');
    router.refresh();
  }, [router, supabase]);

  // 1. Auth Listener (Runs on mount)
  useEffect(() => {
    let mounted = true;
    
    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(Boolean(data?.session));
    });

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // 2. Auto-Logout Timer (Runs when loggedIn changes)
  useEffect(() => {
    // Only run this listener if the user is actually logged in
    if (!loggedIn) return;

    // 20 minutes in milliseconds
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

    // Events that count as "activity"
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Setup listeners
    resetTimer(); // Start the timer immediately
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Cleanup listeners when component unmounts or user logs out
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [loggedIn, performLogout]);

  return (
    <nav className="p-5 bg-white border-b border-gray-200 flex justify-between items-center">
      <div className="font-bold text-lg text-blue-600">🚗 Symbria Delivery Logistics</div>
      <div className="space-x-4 flex items-center">
        {/* Conditional Link: Dashboard if logged in, Home if not */}
        <Link 
          href={loggedIn ? "/dashboard" : "/"} 
          className="text-gray-600 hover:text-blue-500"
        >
          {loggedIn ? "Dashboard" : "Home"}
        </Link>
        
        <Link href="/about" className="text-gray-600 hover:text-blue-500">About</Link>
        
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
