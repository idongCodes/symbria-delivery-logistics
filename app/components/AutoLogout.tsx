"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

export default function AutoLogout() {
  const router = useRouter();
  const supabase = createClient();
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    events.forEach((event) => window.addEventListener(event, updateActivity));

    const intervalId = setInterval(async () => {
      if (Date.now() - lastActivity >= TIMEOUT_MS) {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }
    }, 60 * 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity));
      clearInterval(intervalId);
    };
  }, [lastActivity, router, supabase]);

  return null;
}