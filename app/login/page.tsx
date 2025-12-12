"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Importing the new client

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient(); // Initialize Supabase
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Error: " + error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    
    // This sends a confirmation email by default
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Success! Check your email for a confirmation link.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Symbria Logistics</h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 rounded text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 rounded text-black"
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={handleRegister}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-blue-600 underline"
          >
            Need an account? Register here
          </button>
        </div>
      </div>
    </div>
  );
}
