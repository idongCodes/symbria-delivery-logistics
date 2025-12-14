import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* 1. HERO IMAGE SECTION (Top) */}
      <section className="relative w-full bg-gray-900">
        <div className="relative w-full h-[55vh] md:h-[65vh]">
          <Image 
            src="/images/Gemini_Generated_Image_hero_img.png" 
            alt="Driver filling out inspection form" 
            fill 
            className="object-cover object-center" 
            priority
          />
          {/* FADE 1: Image -> Blue */}
          <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-b from-transparent to-blue-900" />
        </div>
      </section>

      {/* 2. MAIN CONTENT SECTION (Middle - Blue) */}
      <section className="relative bg-blue-900 text-white pt-6 pb-20 px-6 shadow-xl z-10 -mt-1">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Streamline Your <br/> RX Logistics.
          </h1>
          
          <p className="text-blue-100 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
            The all-in-one platform for driver inspections, route tracking, and vehicle safety reporting.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 pb-4">
            <Link 
              href="/login" 
              className="bg-white text-blue-900 font-bold px-10 py-4 rounded-full shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-1"
            >
              Driver Login
            </Link>
            <Link 
              href="/contacts" 
              className="bg-transparent border-2 border-white text-white font-semibold px-10 py-4 rounded-full hover:bg-white/10 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* 3. BENEFITS SECTION (Bottom - Gray) */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
           {/* Section Header */}
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Go Digital?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Replacing paper logs with our platform improves accuracy, accountability, and speed.</p>
           </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">
                👁️
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Instant Visibility</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Admins see inspection status in real-time. No waiting for paper logs at the end of the shift.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">
                📸
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Photo Evidence</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Mandatory photo uploads for vehicle conditions create an indisputable history of the fleet.
              </p>
            </div>

            {/* Card 3 - FIX WAS APPLIED HERE */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">
                🧠
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Smart Forms</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dynamic checklists adapt to &quot;Pre-Trip&quot; or &quot;Post-Trip&quot; contexts and enforce descriptions for defects.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-6 text-blue-600">
                🔒
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Secure Records</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Role-based access ensures data integrity. Search, filter, and export PDF reports instantly.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
