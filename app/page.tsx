"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // NEW: State for custom error messages
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Suggestion",
    message: ""
  });

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(""); // Clear previous errors

    // --- VALIDATION: Check for @symbria.com ---
    if (!formData.email.toLowerCase().endsWith('@symbria.com')) {
      setErrorMsg("Please use a valid @symbria.com company email address.");
      setLoading(false);
      return; 
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      message: `[Subject: ${formData.subject}] \n\n${formData.message}`
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setLoading(false);
        setErrorMsg(""); // Success, so clear errors
        
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: "", email: "", subject: "General Suggestion", message: "" });
        }, 3000);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrorMsg("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* 1. HERO IMAGE SECTION */}
      <section className="relative w-full bg-gray-900">
        <div className="relative w-full h-[55vh] md:h-[65vh]">
          <Image 
            src="/images/Gemini_Generated_Image_hero_img.png" 
            alt="Driver filling out inspection form" 
            fill 
            className="object-cover object-center" 
            priority
          />
          <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-b from-transparent to-blue-900" />
        </div>
      </section>

      {/* 2. MAIN CONTENT SECTION */}
      <section className="relative bg-blue-900 text-white pt-6 pb-20 px-6 shadow-xl z-10 -mt-1">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Streamline Your <br/> RX Logistics.
          </h1>
          <p className="text-blue-100 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
            Quick and easy Pre/Post-Trip Inspection management.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 pb-4">
            <Link href="/login" className="bg-white text-blue-900 font-bold px-10 py-4 rounded-full shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-1">
              Driver Login
            </Link>
            <Link href="#contact" className="bg-transparent border-2 border-white text-white font-semibold px-10 py-4 rounded-full hover:bg-white/10 transition">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* 3. BENEFITS SECTION */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Go Digital?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Replacing paper logs with this platform improves accuracy, accountability, and speed.</p>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">👁️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Instant Visibility</h3>
              <p className="text-gray-600 text-base leading-relaxed">Admins see inspection status in real-time. No waiting for paper logs at the end of the shift.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">📸</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Photo Evidence</h3>
              <p className="text-gray-600 text-base leading-relaxed">Mandatory photo uploads for vehicle conditions create an indisputable history of the fleet.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">🧠</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Smart Forms</h3>
              <p className="text-gray-600 text-base leading-relaxed">Dynamic checklists adapt to &quot;Pre-Trip&quot; or &quot;Post-Trip&quot; contexts and enforce descriptions for defects.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Secure Records</h3>
              <p className="text-gray-600 text-base leading-relaxed">Role-based access ensures data integrity. Search, filter, and export PDF reports instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEEDBACK SECTION */}
      <section id="contact" className="w-[90%] mx-auto bg-white rounded-3xl shadow-xl py-16 px-6 mb-20 relative z-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">We Value Your Feedback</h2>
          <p className="text-gray-500 mb-8">Help us improve the Symbria RX Logistics experience. Let us know if you encounter any issues or have suggestions.</p>
          
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                id="name" 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your Name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                id="email" 
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  if (errorMsg) setErrorMsg(""); // Clear error as they type
                }}
                className={`w-full border p-3 rounded-lg focus:ring-2 outline-none ${
                  errorMsg ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="name@symbria.com"
                required
              />
              {/* ERROR MESSAGE DISPLAY */}
              {errorMsg && (
                <p className="text-red-500 text-sm mt-1 animate-in slide-in-from-top-1">
                  {errorMsg}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select 
                id="subject" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>General Suggestion</option>
                <option>Report a Bug</option>
                <option>Feature Request</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                id="message" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4} 
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Type your feedback here..."
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || submitted}
              className={`w-full font-bold py-4 rounded-lg transition duration-300 ${
                submitted 
                  ? "bg-green-600 text-white cursor-default" 
                  : loading 
                    ? "bg-gray-400 text-white cursor-wait" 
                    : "bg-blue-900 text-white hover:bg-blue-800"
              }`}
            >
              {loading ? "Sending..." : submitted ? "Thank You! Feedback Sent." : "Submit Feedback"}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
