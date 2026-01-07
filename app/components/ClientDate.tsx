"use client";

import { useEffect, useState } from "react";

export default function ClientDate({ timestamp }: { timestamp: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-50">...</span>;
  }

  // 1. Force UTC interpretation if the string lacks timezone info
  // If the string is "2026-01-07T00:14:00" (no Z), append Z so browser knows it's UTC.
  const safeTimestamp = timestamp.endsWith("Z") || timestamp.includes("+") 
    ? timestamp 
    : `${timestamp}Z`;

  const date = new Date(safeTimestamp);
  
  return (
    <span>
      {date.toLocaleDateString()} <span className="text-gray-400">at</span> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}