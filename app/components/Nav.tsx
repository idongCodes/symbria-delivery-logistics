"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Nav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      const supabase = getSupabaseClient();
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
    } catch (err) {
      // If getSupabaseClient throws (server-side), just ignore — nav will render unauthenticated
      setLoggedIn(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      // ignore
    } finally {
      setLoggedIn(false);
      router.push('/');
    }
  };

  return (
    <nav className="p-5 bg-white border-b border-gray-200 flex justify-between items-center">
      <div className="font-bold text-lg text-blue-600">🚗 Symbria Delivery Logistics</div>
      <div className="space-x-4 flex items-center">
        <Link href="/" className="text-gray-600 hover:text-blue-500">Home</Link>
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
