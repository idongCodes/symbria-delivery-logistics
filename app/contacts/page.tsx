"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// --- CONFIGURATION: ROUTE DATA ---
const ROUTE_DATA = [
  {
    id: "001",
    region: "North East (NE)",
    regionColor: "text-blue-600 dark:text-blue-400",
    scannerPhone: "331-219-9534",
    duration: "9 Hrs", // Updated: 5h Drive + 2h40m Stops + 1h Break
    stops: [
      { name: "Sherrill House", address: "135 S Huntington Ave, Boston, MA 02130", phone: "617-731-2400" },
      { name: "South Cove Manor", address: "288 Washington St, Quincy, MA 02169", phone: "617-423-0590" },
      { name: "Dwyer Home", address: "25 Stonehaven Dr, Weymouth, MA 02190", phone: "781-660-5050" },
      { name: "Lasell Village", address: "120 Seminary Ave, Auburndale, MA 02466", phone: "617-663-7100" },
      { name: "Holy Trinity", address: "300 Barber Ave, Worcester, MA 01606", phone: "508-852-1000" },
      { name: "Knollwood", address: "87 Briarwood Cir, Worcester, MA 01606", phone: "508-853-6910" },
      { name: "Newbury Court", address: "100 Newbury Ct, Concord, MA 01742", phone: "978-402-8261" },
      { name: "Edgewood Meadows", address: "575 Osgood St, North Andover, MA 01845", phone: "978-725-4121" },
    ]
  },
  {
    id: "002",
    region: "West (W)",
    regionColor: "text-purple-600 dark:text-purple-400",
    scannerPhone: "331-329-2166",
    duration: "4.5 Hrs", // Updated: 2.5h Drive + 1h Stops + 1h Break
    stops: [
      { name: "The Overlook", address: "88 Masonic Home rd, Charlton, MA 01507", phone: "508-202-4090" },
      { name: "Livewell", address: "1261 S Main St, Plantsville, CT 06479", phone: "508-628-9000" },
      { name: "St. Joseph", address: "14 Club Rd, Windham, CT 06280", phone: "860-456-1107" },
    ]
  },
  {
    id: "003",
    region: "South East (SE)",
    regionColor: "text-green-600 dark:text-green-400",
    scannerPhone: "847-269-4380",
    duration: "5 Hrs", // Updated: 2h Drive + 1h40m Stops + 1h Break
    stops: [
      { name: "Catholic Memorial", address: "2446 Highland Ave, Fall River, MA 02720", phone: "508-679-0011" },
      { name: "Sacred Heart", address: "359 Summer St, New Bedford, MA 02740", phone: "508-996-6751" },
      { name: "Marian Manor", address: "33 Summer St, Taunton, MA 02780", phone: "508-822-4885" },
      { name: "Madonna Manor", address: "85 N Washington St, North Attleboro, MA 02760", phone: "617-731-2400" },
      { name: "Our Lady's Haven", address: "71 Center St, Fairhaven, MA 02719", phone: "508-999-4561" },
    ]
  }
];

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
  const drivers = profiles.filter(p => 
    p.email !== hiddenEmail && 
    (
      p.job_title === "Delivery Driver" || 
      p.role === "Driver" || 
      p.email === adminEmail 
    )
  );

  // 2. Management List
  const managers = profiles.filter(p => 
    p.email !== hiddenEmail && 
    (p.job_title !== "Delivery Driver" && p.role !== "Driver") &&
    p.email !== adminEmail 
  );

  if (loading) return <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading contacts...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 border-b dark:border-gray-700 pb-4">Important Numbers & Info</h2>
      
      {/* --- SECTION 1: DEVELOPER & ADMIN (Hardcoded) --- */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 rounded text-sm">🛠️</span> Developer & Admin
        </h3>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-sm">👨‍💻</div>
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">Richard Essien</h4>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">Developer / Admin / Driver</p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 dark:text-gray-300">
              <a href="mailto:ressien1@symbria.com" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <span className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">✉️</span> ressien1@symbria.com
              </a>
              <a href="tel:+17743126471" className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <span className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded">📞</span> +1 (774) 312-6471
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- SECTION 2: MANAGEMENT (Dynamic) --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1 rounded text-sm">👔</span> Management
          </h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[200px]">
            <ul className="space-y-4">
              {managers.length === 0 ? (
                <li className="text-gray-400 italic text-center">No managers found.</li>
              ) : (
                managers.map(manager => (
                  <li key={manager.id} className="flex items-start gap-3 border-b border-gray-50 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {manager.first_name?.[0]}{manager.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{manager.first_name} {manager.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{manager.job_title}</p>
                      <div className="mt-1 flex flex-col text-sm">
                        <a href={`mailto:${manager.email}`} className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">{manager.email}</a>
                        {manager.phone && (
                          <a href={`tel:${manager.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{manager.phone}</a>
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
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded text-sm">🚚</span> Drivers
          </h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[200px]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Active driver roster.</p>
            
            <div className="space-y-3">
              
              {/* --- STATIC DISPATCH PLACEHOLDER --- */}
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                <span className="font-bold text-gray-800 dark:text-gray-200">Driver Dispatch</span>
                <div className="flex flex-col items-end gap-1">
                  <a href="tel:8775090620" className="text-sm bg-white dark:bg-gray-700 border border-yellow-200 dark:border-yellow-700 px-3 py-1 rounded text-blue-600 dark:text-blue-300 font-semibold hover:bg-blue-50 dark:hover:bg-gray-600 transition">
                    Call Dispatch
                  </a>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">for dispatch press option 4</span>
                </div>
              </div>

              {/* Dynamic Driver List */}
              {drivers.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm italic">No individual drivers registered yet.</div>
              ) : (
                drivers.map(driver => (
                  <div key={driver.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 block">{driver.first_name} {driver.last_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{driver.job_title}</span>
                    </div>
                    <div className="flex gap-2">
                      {driver.phone && (
                        <a href={`tel:${driver.phone}`} className="text-xs bg-white dark:bg-gray-600 border dark:border-gray-500 px-2 py-1 rounded text-green-600 dark:text-green-400 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30" title="Call">📞</a>
                      )}
                      <a href={`mailto:${driver.email}`} className="text-xs bg-white dark:bg-gray-600 border dark:border-gray-500 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Email">✉️</a>
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
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1 rounded text-sm">📍</span> Routes Info
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* --- MOBILE VIEW (CARDS) --- */}
          <div className="block md:hidden space-y-4 p-4">
            {ROUTE_DATA.map((route) => (
              <div key={route.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div>
                     <h4 className={`text-lg font-bold ${route.regionColor}`}>{route.region}</h4>
                     <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">ID: {route.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Est. Time</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{route.duration}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                   <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase block mb-1">Scanner Phone</span>
                   <a href={`tel:${route.scannerPhone.replace(/-/g, '')}`} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg font-medium justify-center">
                      📞 {route.scannerPhone}
                   </a>
                </div>

                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase block mb-2">Locations ({route.stops.length})</span>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    {route.stops.map((stop, idx) => (
                      <div key={idx} className="pb-2 mb-2 border-b border-gray-200 dark:border-gray-600 last:border-0 last:mb-0 last:pb-0">
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{stop.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stop.address}</p>
                        <a href={`tel:${stop.phone.replace(/-/g, '')}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          {stop.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- DESKTOP VIEW (TABLE) --- */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Route ID</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Region</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Scanner Ph. No.</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Locations Info</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Est. Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ROUTE_DATA.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 align-top transition-colors">
                    <td className="p-4 font-medium text-red-600 dark:text-red-400">{route.id}</td>
                    <td className={`p-4 font-bold ${route.regionColor}`}>{route.region}</td>
                    <td className="p-4 text-gray-800 dark:text-gray-300">
                      <a href={`tel:${route.scannerPhone.replace(/-/g, '')}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                        {route.scannerPhone}
                      </a>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      <div className="space-y-4">
                        {route.stops.map((stop, idx) => (
                          <div key={idx}>
                            <span className="font-bold text-gray-800 dark:text-gray-200 block">{stop.name}</span>
                            <span className="text-xs block">{stop.address}</span>
                            <a href={`tel:${stop.phone.replace(/-/g, '')}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              {stop.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{route.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}