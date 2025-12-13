"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const router = useRouter();
  // Unused 'pathname' removed to prevent build errors
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
    };
    
    checkUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* UPDATED HEADING */}
        <Link href="/" className="font-bold text-xl tracking-tight hover:text-blue-200 transition">
          Symbria RX Logistics
        </Link>
        
        <div className="flex gap-6 text-sm font-medium">
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
      </div>
    </nav>
  );
}
