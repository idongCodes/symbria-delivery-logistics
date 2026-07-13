"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const allowedEmails = ["lholden@rxdeliverylogistics.com", "ressien1@rxdeliverylogistics.com", "idongesit_essien@ymail.com"];
    if (!allowedEmails.includes(email.toLowerCase().trim())) {
      setMessage("Error: Unauthorized email. Please use the public dashboard access.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    } else {
      setMessage("Success! Logging you in...");
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50  transition-colors">
      <div className="bg-white  p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300 border border-gray-200 ">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 ">
          Admin Login
        </h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700  " : "bg-green-100 text-green-700  "}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          {/* EMAIL INPUT */}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-3 rounded text-black    focus:ring-2 focus:ring-blue-500 outline-none" required />

          {/* PASSWORD INPUT */}
          <div className="relative w-full">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border p-3 pr-10 rounded text-black    focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500  hover:text-gray-700  transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <button type="submit" disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold mt-2 transition-colors">
            {loading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}