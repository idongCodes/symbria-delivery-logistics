"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  job_title: string;
  phone: string;
};

export default function ContactsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getContacts() {
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (error) {
        console.error("Supabase Error:", error.message);
      } else if (data) {
        setProfiles(data);
      }
      setLoading(false);
    }
    getContacts();
  }, [supabase]);

  // --- FILTERING LOGIC ---
  const adminEmail = "ressien1@symbria.com";        // This Admin SHOULD show up
  const hiddenEmail = "idongesit_essien@ymail.com"; // This Admin should remain HIDDEN

  // 1. Drivers List
  // Logic: Must NOT be the hidden email AND (is a driver OR is the allowed admin)
  const drivers = profiles.filter(p => 
    p.email !== hiddenEmail && 
    (
      p.job_title === "Delivery Driver" || 
      p.role === "Driver" || 
      p.email === adminEmail 
    )
  );

  // 2. Management List
  // Logic: Must NOT be the hidden email AND (is NOT a driver) AND (is NOT the allowed admin)
  const managers = profiles.filter(p => 
    p.email !== hiddenEmail && 
    (p.job_title !== "Delivery Driver" && p.role !== "Driver") &&
    p.email !== adminEmail 
  );

  if (loading) return <div className="p-12 text-center text-gray-500">Loading contacts...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Important Numbers & Info</h2>
      
      {/* --- SECTION 1: DEVELOPER & ADMIN (Hardcoded) --- */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-1 rounded text-sm">🛠️</span> Developer & Admin
        </h3>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-sm">👨‍💻</div>
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-bold text-gray-900">Richard Essien</h4>
            <p className="text-blue-600 font-medium mb-3">Developer / Admin / Driver</p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
              <a href="mailto:ressien1@symbria.com" className="flex items-center gap-2 hover:text-blue-600 transition">
                <span className="bg-gray-100 p-1.5 rounded">✉️</span> ressien1@symbria.com
              </a>
              <a href="tel:+17743126471" className="flex items-center gap-2 hover:text-blue-600 transition">
                <span className="bg-gray-100 p-1.5 rounded">📞</span> +1 (774) 312-6471
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- SECTION 2: MANAGEMENT (Dynamic) --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 p-1 rounded text-sm">👔</span> Management
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[200px]">
            <ul className="space-y-4">
              {managers.length === 0 ? (
                <li className="text-gray-400 italic text-center">No managers found.</li>
              ) : (
                managers.map(manager => (
                  <li key={manager.id} className="flex items-start gap-3 border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {manager.first_name?.[0]}{manager.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{manager.first_name} {manager.last_name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{manager.job_title}</p>
                      <div className="mt-1 flex flex-col text-sm">
                        <a href={`mailto:${manager.email}`} className="text-gray-600 hover:text-purple-600">{manager.email}</a>
                        {manager.phone && (
                          <a href={`tel:${manager.phone}`} className="text-blue-600 hover:underline">{manager.phone}</a>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* --- SECTION 3: DRIVERS (Dynamic) --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 p-1 rounded text-sm">🚚</span> Drivers
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[200px]">
            <p className="text-sm text-gray-500 mb-4">Active driver roster.</p>
            
            <div className="space-y-3">
              
              {/* --- STATIC DISPATCH PLACEHOLDER --- */}
              <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <span className="font-bold text-gray-800">Driver Dispatch</span>
                <a href="tel:5559998888" className="text-sm bg-white border border-yellow-200 px-3 py-1 rounded text-blue-600 font-semibold hover:bg-blue-50 hover:text-blue-700 transition">
                  Call Dispatch
                </a>
              </div>

              {/* Dynamic Driver List */}
              {drivers.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm italic">No individual drivers registered yet.</div>
              ) : (
                drivers.map(driver => (
                  <div key={driver.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                    <div>
                      <span className="font-medium text-gray-800 block">{driver.first_name} {driver.last_name}</span>
                      <span className="text-xs text-gray-500">{driver.job_title}</span>
                    </div>
                    <div className="flex gap-2">
                      {driver.phone && (
                        <a href={`tel:${driver.phone}`} className="text-xs bg-white border px-2 py-1 rounded text-green-600 font-semibold hover:bg-green-100" title="Call">📞</a>
                      )}
                      <a href={`mailto:${driver.email}`} className="text-xs bg-white border px-2 py-1 rounded text-blue-600 font-semibold hover:bg-blue-100" title="Email">✉️</a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* --- SECTION 4: ROUTES (Static) --- */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-600 p-1 rounded text-sm">📍</span> Standard Routes
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Route ID</th>
                <th className="p-4 font-semibold text-gray-700">Region</th>
                <th className="p-4 font-semibold text-gray-700">Primary Stops</th>
                <th className="p-4 font-semibold text-gray-700">Est. Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">R-101</td>
                <td className="p-4 text-gray-800">North Shore</td>
                <td className="p-4 text-gray-600">Salem, Beverly, Peabody</td>
                <td className="p-4 text-gray-500">4 Hrs</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">R-102</td>
                <td className="p-4 text-gray-800">Metro West</td>
                <td className="p-4 text-gray-600">Framingham, Natick, Wellesley</td>
                <td className="p-4 text-gray-500">5.5 Hrs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
