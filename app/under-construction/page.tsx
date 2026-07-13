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
                  className="w-16 h-16 animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17L17.25 21A1.24 1.24 0 1115.5 22.75l-5.83-5.83A7.4 7.4 0 013 11.5 7.4 7.4 0 0110.5 4a7.4 7.4 0 016.17 3.33L22.5 1.5 24 3l-5.83 5.83A7.4 7.4 0 0111.42 15.17z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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
          <p className="text-gray-600 mb-6 leading-relaxed">
            The page you are trying to access is currently undergoing scheduled maintenance or is under construction. Please check back later.
          </p>

          {/* Visual progress loader */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
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
