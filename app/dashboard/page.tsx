"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!data?.session) {
          router.replace('/login');
        } else {
          setChecking(false);
        }
        // subscribe to auth changes to handle sign-out
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            router.replace('/login');
          }
        });

        return () => listener?.subscription.unsubscribe();
      } catch (err) {
        // if client init failed, redirect to login
        router.replace('/login');
      }
    };

    check();
    return () => { mounted = false; };
  }, [router]);

  if (checking) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard!</h1>
      <p>You have successfully logged in.</p>
    </div>
  );
}
