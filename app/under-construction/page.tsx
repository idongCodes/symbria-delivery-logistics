import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Under Construction | Rx Delivery Logistics",
  description: "The page you are looking for is currently under construction.",
};

export default function UnderConstructionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="relative">
          {/* Animated Construction Badge/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer pulsing ring */}
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
              {/* Inner container */}
              <div className="relative bg-indigo-50 text-indigo-600 p-4 rounded-full border border-indigo-100">
                <svg
                  className="w-16 h-16 animate-spin text-indigo-600"
                  style={{ animationDuration: '6s' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.273.807-.11 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 01-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full mb-3 uppercase tracking-wider">
            Error 404
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
            Under Construction
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-3 leading-relaxed">
            The page you are trying to access is currently undergoing scheduled maintenance or is under construction.
          </p>

          <p className="text-sm text-gray-500 mb-6 italic">
            We apologize for any inconvenience this may cause.
          </p>

          {/* MS Forms Links */}
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-5 mb-6 text-left space-y-3">
            <h3 className="text-sm font-semibold text-indigo-900 mb-1">
              📋 Temporary Replacement Forms:
            </h3>
            <a 
              href="https://forms.office.com/r/r99SMXKAtJ" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between w-full bg-white hover:bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-lg text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-all duration-200 shadow-sm"
            >
              <span>Pre-Trip Microsoft Form</span>
              <span className="text-xs">↗️</span>
            </a>
            <a 
              href="https://forms.office.com/r/Dxr65cDWLN" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between w-full bg-white hover:bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-lg text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-all duration-200 shadow-sm"
            >
              <span>Post-Trip Microsoft Form</span>
              <span className="text-xs">↗️</span>
            </a>
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 flex flex-col gap-2">
            <p>Rx Delivery Logistics System</p>
            <p>
              Need immediate assistance? Contact support at{" "}
              <a href="mailto:idongesit_essien@ymail.com" className="text-indigo-600 hover:underline">
                idongesit_essien@ymail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
