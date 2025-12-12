"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  // Create client once
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let mounted = true;
    
    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(Boolean(data?.session));
    });

    // Listen for changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push('/login');
    router.refresh();
  };

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
            onClick={handleLogout}
            className="ml-4 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
