"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Updated import

export default function Dashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
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
