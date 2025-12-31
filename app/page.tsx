"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [view, setView] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Job Title State
  const [jobTitle, setJobTitle] = useState("Delivery Driver");
  
  // Role State
  const [role, setRole] = useState<'Driver' | 'Management' | 'Admin'>("Driver");
  
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

    // --- 🔐 PASSWORD MATCH CHECK ---
    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      setLoading(false);
      return;
    }

    const lowerEmail = email.toLowerCase().trim();
    
    // --- 🛡️ ROLE & DOMAIN GUARD LOGIC ---
    const adminAllowlist = ["idongesit_essien@ymail.com", "ressien1@symbria.com"];
    const managementAllowlist = [...adminAllowlist, "lholden@symbria.com"];
    const generalDomain = "@symbria.com";

    if (role === 'Admin' && !adminAllowlist.includes(lowerEmail)) {
      setMessage("Error: You are not authorized to register as an Admin.");
      setLoading(false); return;
    } 
    else if (role === 'Management' && !managementAllowlist.includes(lowerEmail)) {
      setMessage("Error: This email is not authorized for Management access.");
      setLoading(false); return;
    }
    else if (role === 'Driver') {
      const isAllowed = lowerEmail.endsWith(generalDomain) || managementAllowlist.includes(lowerEmail);
      if (!isAllowed) {
        setMessage("Error: Registration is restricted to Symbria employees.");
        setLoading(false); return;
      }
    }
    // ------------------------------------

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,          // Save Phone
          job_title: jobTitle,   // Save Title
          role: role, 
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          {view === 'login' ? 'Login' : 'Create Account'}
        </h1>
        
        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.includes("Error") ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"}`}>
            {message}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          
          {view === 'register' && (
            <>
              {/* Names */}
              <div className="flex gap-2">
                <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 w-1/2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 w-1/2 focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>

              {/* Phone */}
              <input type="tel" placeholder="Phone Number (Ex: 555-123-4567)" value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />

              {/* Job Title Dropdown */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Title:</span>
                <select 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)} 
                  className="border p-3 rounded bg-white dark:bg-gray-700 text-black dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Delivery Driver">Delivery Driver</option>
                  <option value="Logistics Lead">Logistics Lead</option>
                  <option value="Logistics Manager">Logistics Manager</option>
                  <option value="Regional Logistics Manager">Regional Logistics Manager</option>
                </select>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">System Role:</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-2 rounded flex-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200">
                    <input type="radio" name="role" value="Driver" checked={role === 'Driver'} onChange={() => setRole('Driver')} className="accent-blue-600" />
                    Driver
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-2 rounded flex-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200">
                    <input type="radio" name="role" value="Management" checked={role === 'Management'} onChange={() => setRole('Management')} className="accent-purple-600" />
                    Manager
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border dark:border-gray-600 p-2 rounded flex-1 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200">
                    <input type="radio" name="role" value="Admin" checked={role === 'Admin'} onChange={() => setRole('Admin')} className="accent-red-600" />
                    Admin
                  </label>
                </div>
              </div>
            </>
          )}

          {/* EMAIL INPUT */}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-3 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
          
          {/* PASSWORD INPUT WITH TOGGLE */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
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
          
          {/* CONFIRM PASSWORD INPUT WITH TOGGLE */}
          {view === 'register' && (
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm Password" 
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
          )}

          <button type="submit" disabled={loading} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold mt-2 transition-colors">
            {loading ? "Processing..." : (view === 'login' ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{view === 'login' ? "Don't have an account?" : "Already have an account?"}</p>
          <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); setMessage(""); setConfirmPassword(""); setShowPassword(false); setShowConfirmPassword(false); }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {view === 'login' ? "Register here" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}