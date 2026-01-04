"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon } from "@heroicons/react/24/outline";
import { generateShareToken } from "@/app/actions/log-actions";

export default function ShareButton({ logId }: { logId: number }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const token = await generateShareToken(logId);
      const url = `${window.location.origin}/share/${token}`;
      
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000); // Reset after 3s
    } catch (err) {
      alert("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleShare}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm ${
        copied 
          ? "bg-green-100 text-green-700 border border-green-200" 
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {loading ? (
        <span className="animate-pulse">Generating...</span>
      ) : copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          Link Copied!
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4" />
          Share Public Link
        </>
      )}
    </button>
  );
}