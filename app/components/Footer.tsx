"use client";

import { useState } from "react";

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="w-full py-6 text-center text-sm text-gray-400 border-t border-gray-200 bg-white mt-auto">
        <p>
          &copy; {currentYear}{" "}
          {/* Clickable Name Trigger */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="font-medium text-gray-500 hover:text-blue-600 underline decoration-dotted underline-offset-4 transition-colors focus:outline-none"
          >
            Richard Essien
          </button>
          . All rights reserved.
        </p>
      </footer>

      {/* --- POPUP MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Modal Box */}
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
            
            {/* Close 'X' Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            {/* Modal Content */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                👨‍💻
              </div>
              <h3 className="text-xl font-bold text-gray-800">Richard Essien</h3>
              <p className="text-sm text-gray-500">Developer & Admin</p>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</span>
                <a href="mailto:ressien1@symbria.com" className="text-blue-600 font-medium hover:underline">
                  ressien1@symbria.com
                </a>
              </div>
              
              <div className="flex flex-col border-t border-gray-200 pt-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</span>
                <a href="tel:+17743126471" className="text-blue-600 font-medium hover:underline">
                  +1 (774) 312-6471
                </a>
              </div>
            </div>

            {/* Close Button Bottom */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-6 bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition-colors font-medium"
            >
              Close
            </button>

          </div>
          
          {/* Backdrop Click to Close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </>
  );
}
