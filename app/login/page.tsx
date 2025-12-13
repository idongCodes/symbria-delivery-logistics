"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [view, setView] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<'Driver' | 'Management'>("Driver"); // Default to Driver
  
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const lowerEmail = email.toLowerCase().trim();
    
    // --- 🛡️ ROLE & DOMAIN GUARD LOGIC 🛡️ ---
    
    // 1. Define allowed lists
    const managementAllowlist = [
      "idongesit_essien@ymail.com", 
      "ressien1@symbria.com", 
      "lholden@symbria.com"
    ];
    
    const generalDomain = "@symbria.com";
    const devEmail = "idongesit_essien@ymail.com"; // Keep dev access for testing

    // 2. Validate Management Role
    if (role === 'Management') {
      if (!managementAllowlist.includes(lowerEmail)) {
        setMessage("Error: This email is not authorized for Management access.");
        setLoading(false);
        return;
      }
    } 
    // 3. Validate Driver Role (General Symbria Check)
    else {
      const isAllowedDomain = lowerEmail.endsWith(generalDomain) || lowerEmail === devEmail;
      if (!isAllowedDomain) {
        setMessage("Error: Registration is restricted to Symbria employees.");
        setLoading(false);
        return;
      }
    }
    // ------------------------------------------

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role, // Save the role to the user's profile
        },
      },
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Success! Check your email for a confirmation link.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {view === 'login' ? 'Login' : 'Create Account'}
        </h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          
          {view === 'register' && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border p-3 rounded text-black w-1/2"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border p-3 rounded text-black w-1/2"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">I am a:</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded flex-1 hover:bg-gray-50">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Driver"
                      checked={role === 'Driver'}
                      onChange={() => setRole('Driver')}
                      className="accent-blue-600"
                    />
                    <span className="text-gray-700 font-medium">Driver</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border p-3 rounded flex-1 hover:bg-gray-50">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Management"
                      checked={role === 'Management'}
                      onChange={() => setRole('Management')}
                      className="accent-blue-600"
                    />
                    <span className="text-gray-700 font-medium">Management</span>
                  </label>
                </div>
              </div>
            </>
          )}

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
            className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold mt-2"
          >
            {loading ? "Processing..." : (view === 'login' ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <p className="text-gray-600 text-sm mb-2">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            onClick={() => {
              setView(view === 'login' ? 'register' : 'login');
              setMessage(""); 
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {view === 'login' ? "Register here" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
