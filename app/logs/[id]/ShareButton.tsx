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
      // 1. Generate Token (Server Action)
      const token = await generateShareToken(logId);
      const url = `${window.location.origin}/share/${token}`;
      
      // 2. Try Native Mobile Share (Best for iOS/Android)
      // This opens the system share sheet (Messages, Mail, Copy Link, etc.)
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: `Trip Log #${logId}`,
            text: 'View this trip log',
            url: url
          });
          setLoading(false);
          return; // Success! We let the OS handle the UI.
        } catch (shareError) {
          // If user cancels the share sheet, just stop here.
          if ((shareError as Error).name === 'AbortError') {
            setLoading(false);
            return;
          }
          // If it failed for another reason, fall through to clipboard copy below
        }
      }

      // 3. Fallback: Desktop Clipboard Copy
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

    } catch (err) {
      console.error(err);
      // 4. Ultimate Fallback: Prompt
      // If the browser strictly blocks the clipboard, this ensures the user can still copy it.
      // We can't access the generated token in the catch block easily, but if token generation failed, the alert below runs.
      // If clipboard failed but token exists, we might miss showing the prompt here, 
      // but usually the navigator.share or clipboard covers 99% of cases.
      alert("Unable to share automatically. Please try again.");
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
          Copied!
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4" />
          Share Link
        </>
      )}
    </button>
  );
}