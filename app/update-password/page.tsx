"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    } else {
      setMessage("Success! Your password has been updated. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Update Password
        </h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="New Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none w-full pr-10" 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm New Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={`border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none w-full pr-10 ${confirmPassword && password !== confirmPassword ? "border-red-500 bg-red-50 dark:bg-red-900/20" : ""}`} 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold mt-2 transition-colors">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
