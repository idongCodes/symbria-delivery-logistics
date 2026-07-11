"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// --- CONFIGURATION: ROUTE DATA ---
const ROUTE_DATA = [
  {
    id: "001",
    region: "North East (NE)",
    regionColor: "text-blue-600 ",
    scannerPhone: "331-219-9534",
    duration: "10.5 Hrs", // Updated: 5h Drive + 4h30m Stops + 1h Break
    stops: []
  },
  {
    id: "002",
    region: "South West (SW)",
    regionColor: "text-purple-600 ",
    scannerPhone: "331-329-2166",
    duration: "9.0 Hrs", // Updated: 4.5h Drive + 3.5h Stops + 1h Break
    stops: []
  },
  {
    id: "003",
    region: "South East (SE)",
    regionColor: "text-green-600 ",
    scannerPhone: "847-269-4380",
    duration: "7.5 Hrs", // Updated: 3.5h Drive + 3h Stops + 1h Break
    stops: []
  }
];

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  job_title: string | null;
  phone: string | null;
};

const PROFILES_DATA: Profile[] = [
  { id: "27b38b60-3c77-43e2-8052-fca71495d3a0", first_name: "Richard", last_name: "Essien", email: "ressien1@symbria.com", role: "Admin", job_title: "Delivery Driver", phone: "+17743126471" },
  { id: "39c7ffa7-646d-4f66-b986-fba5166267a6", first_name: "Richard", last_name: "Essien", email: "idongesit_essien@ymail.com", role: "Admin", job_title: null, phone: "+17743126471" },
  { id: "74a3b563-6edd-42e9-9bbb-17568209f303", first_name: "Henry", last_name: "Edu", email: "hedusei@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "7742535472" },
  { id: "a95812b1-ee0c-49de-a08f-bf837ff31ad4", first_name: "Lester", last_name: "Holden", email: "lholden@symbria.com", role: "Management", job_title: "Logistics Lead", phone: "17745710527" },
  { id: "bfdcfa68-c121-47e2-a3a6-beb3646d0bbf", first_name: "Angelina", last_name: "Bermudez", email: "abermudez@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "5406640494" },
  { id: "1e740275-02a1-4edd-8ec4-f6797449a036", first_name: "Nicolas", last_name: "Guastini", email: "nguastini@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "8603825753" },
  { id: "59bac5f3-2a6b-4d83-b2b4-7b6a255dd35f", first_name: "Andrew", last_name: "Schofield ", email: "aschofield@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "7746330462" },
  { id: "2af0e4a8-331a-4d4b-ad89-393bb2b79cf1", first_name: "Ryan", last_name: "Mapes", email: "rmapes@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "774-272-5107" },
  { id: "7e4778f5-d6e8-4369-b296-688e2f9ca935", first_name: "Michael ", last_name: "Boylan ", email: "mboylan@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "5088689341" },
  { id: "1c6c2ab5-29b1-4965-9e18-3000f70de397", first_name: "Julian", last_name: "Sarkodieh", email: "jsarkodieh@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "15084101032" },
  { id: "38093bc5-def4-448b-806b-0ea86e9e56d1", first_name: "Mario", last_name: "Hargrove", email: "mhargrove@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "15083408591" },
];

export default function ContactsPage() {
  const supabase = createClient();
  const profiles = PROFILES_DATA;
  const [dbRoutes, setDbRoutes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data } = await supabase.from('routes').select('id, name').eq('active', true).order('name');
      if (data) setDbRoutes(data);
    };
    fetchRoutes();
  }, [supabase]);

  const displayRoutes = dbRoutes.map(dbRoute => {
    const staticMatch = ROUTE_DATA.find(r => r.region === dbRoute.name);
    if (staticMatch) return staticMatch;
    
    return {
      id: dbRoute.id.toString(),
      region: dbRoute.name,
      regionColor: "text-gray-600",
      scannerPhone: "N/A",
      duration: "TBD",
      stops: []
    };
  });

  const finalRoutes = displayRoutes.length > 0 ? displayRoutes : ROUTE_DATA;

  // --- FILTERING LOGIC ---
  const adminEmail = "ressien1@symbria.com";        // This Admin SHOULD show up
  const hiddenEmail = "idongesit_essien@ymail.com"; // This Admin should remain HIDDEN

  // Helper Component for Navigation Dropdown
  const NavDropdownMenu = ({ stops, isDesktop }: { stops: { address: string }[], isDesktop?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [links, setLinks] = useState({ google: '', apple: '', waze: '' });

    useEffect(() => {
      if (!stops || stops.length === 0) return;

      const origin = encodeURIComponent("Midstate Dr, Auburn, MA");
      const destination = encodeURIComponent("Midstate Dr, Auburn, MA");
      const waypoints = encodeURIComponent(stops.map(s => s.address).join('|'));
      
      const google = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
      
      const appleWaypoints = stops.map(s => `&daddr=${encodeURIComponent(s.address)}`).join('');
      const apple = `http://maps.apple.com/?saddr=${origin}${appleWaypoints}&daddr=${destination}&dirflg=d`;
      
      const waze = `https://waze.com/ul?q=${encodeURIComponent(stops[0].address)}&navigate=yes`;
      
      setLinks({ google, apple, waze });
    }, [stops]);

    useEffect(() => {
      const handleOutsideClick = () => setIsOpen(false);
      if (isOpen) {
        document.addEventListener('click', handleOutsideClick);
      }
      return () => document.removeEventListener('click', handleOutsideClick);
    }, [isOpen]);

    return (
      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm flex items-center transition-colors font-semibold ${isDesktop ? 'text-[11px] inline-flex py-1.5 px-3 gap-1.5' : 'text-[11px] py-1 px-2.5 gap-1.5'}`}
        >
          <span>🗺️</span> {isDesktop ? 'Start Navigation' : 'Start Nav'}
        </button>
        
        {isOpen && (
          <div className={`absolute ${isDesktop ? 'left-0 mt-2' : 'right-0 mt-2'} w-40 rounded-md shadow-lg bg-white  ring-1 border border-gray-100  z-50 overflow-hidden`}>
            <div className="py-1">
              <a href={links.google} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-xs text-gray-700  hover:bg-blue-50  font-medium transition-colors">Google Maps</a>
              <a href={links.apple} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-xs text-gray-700  hover:bg-blue-50  font-medium transition-colors">Apple Maps</a>
              <a href={links.waze} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-xs text-gray-700  hover:bg-blue-50  font-medium transition-colors">Waze <span className="text-[10px] text-gray-500  font-normal block mt-0.5">(1st stop only)</span></a>
            </div>
          </div>
        )}
      </div>
    );
  };

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

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50  min-h-screen transition-colors">
      <h2 className="text-3xl font-bold text-gray-800  mb-8 border-b  pb-4">Important Numbers & Info</h2>
      
      {/* --- SECTION 1: DEVELOPER & ADMIN (Hardcoded) --- */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-700  mb-4 flex items-center gap-2">
          <span className="bg-blue-100  text-blue-600  p-1 rounded text-sm">🛠️</span> Developer & Admin
        </h3>
        <div className="bg-white  p-6 rounded-xl shadow-sm border border-gray-200  flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-sm">👨‍💻</div>
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-bold text-gray-900 ">Richard Essien</h4>
            <p className="text-blue-600  font-medium mb-3">Developer / Admin / Driver</p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 ">
              <a href="mailto:ressien1@symbria.com" className="flex items-center gap-2 hover:text-blue-600  transition">
                <span className="bg-gray-100  p-1.5 rounded">✉️</span> ressien1@symbria.com
              </a>
              <a href="tel:+17743126471" className="flex items-center gap-2 hover:text-blue-600  transition">
                <span className="bg-gray-100  p-1.5 rounded">📞</span> +1 (774) 312-6471
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- SECTION 2: MANAGEMENT (Dynamic) --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700  mb-4 flex items-center gap-2">
            <span className="bg-purple-100  text-purple-600  p-1 rounded text-sm">👔</span> Management
          </h3>
          <div className="bg-white  p-6 rounded-xl shadow-sm border border-gray-200  min-h-[200px]">
            <ul className="space-y-4">
              {managers.length === 0 ? (
                <li className="text-gray-400 italic text-center">No managers found.</li>
              ) : (
                managers.map(manager => (
                  <li key={manager.id} className="flex items-start gap-3 border-b border-gray-50  last:border-0 pb-3 last:pb-0">
                    <div className="w-10 h-10 bg-purple-50  text-purple-600  rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {manager.first_name?.[0]}{manager.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 ">{manager.first_name} {manager.last_name}</p>
                      <p className="text-xs text-gray-500  uppercase tracking-wide">{manager.job_title}</p>
                      <div className="mt-1 flex flex-col text-sm">
                        <a href={`mailto:${manager.email}`} className="text-gray-600  hover:text-purple-600 ">{manager.email}</a>
                        {manager.phone && (
                          <a href={`tel:${manager.phone}`} className="text-blue-600  hover:underline">{manager.phone}</a>
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
          <h3 className="text-xl font-bold text-gray-700  mb-4 flex items-center gap-2">
            <span className="bg-green-100  text-green-600  p-1 rounded text-sm">🚚</span> Drivers
          </h3>
          <div className="bg-white  p-6 rounded-xl shadow-sm border border-gray-200  min-h-[200px]">
            <p className="text-sm text-gray-500  mb-4">Active driver roster.</p>
            
            <div className="space-y-3">
              
              {/* --- STATIC DISPATCH PLACEHOLDER --- */}
              <div className="flex justify-between items-center p-3 bg-yellow-50  border border-yellow-100  rounded-lg">
                <span className="font-bold text-gray-800 ">Driver Dispatch</span>
                <div className="flex flex-col items-end gap-1">
                  <a href="tel:6309818000" className="text-sm bg-white  border border-yellow-200  px-3 py-1 rounded text-blue-600  font-semibold hover:bg-blue-50  transition">
                    Call Dispatch
                  </a>
                  <span className="text-[10px] text-gray-600  font-medium">press option 6</span>
                </div>
              </div>

              {/* Dynamic Driver List */}
              {drivers.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm italic">No individual drivers registered yet.</div>
              ) : (
                drivers.map(driver => (
                  <div key={driver.id} className="flex justify-between items-center p-3 bg-gray-50  rounded-lg hover:bg-blue-50  transition">
                    <div>
                      <span className="font-medium text-gray-800  block">{driver.first_name} {driver.last_name}</span>
                      <span className="text-xs text-gray-500 ">{driver.job_title}</span>
                    </div>
                    <div className="flex gap-2">
                      {driver.phone && (
                        <a href={`tel:${driver.phone}`} className="text-xs bg-white  border  px-2 py-1 rounded text-green-600  font-semibold hover:bg-green-100 " title="Call">📞</a>
                      )}
                      <a href={`mailto:${driver.email}`} className="text-xs bg-white  border  px-2 py-1 rounded text-blue-600  font-semibold hover:bg-blue-100 " title="Email">✉️</a>
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
        <h3 className="text-xl font-bold text-gray-700  mb-4 flex items-center gap-2">
          <span className="bg-orange-100  text-orange-600  p-1 rounded text-sm">📍</span> Routes Info
        </h3>
        <div className="bg-white  rounded-xl shadow-sm border border-gray-200  overflow-hidden">
          
          {/* --- MOBILE VIEW (CARDS) --- */}
          <div className="block md:hidden space-y-4 p-4">
            {finalRoutes.map((route) => (
              <div key={route.id} className="bg-white  p-5 rounded-xl shadow-sm border border-gray-200 ">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100 ">
                  <div>
                     <h4 className={`text-lg font-bold ${route.regionColor}`}>{route.region}</h4>
                     <span className="text-sm font-bold text-red-600  bg-red-50  px-2 py-0.5 rounded">ID: {route.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-500  font-semibold uppercase">Est. Time</span>
                    <span className="text-sm font-medium text-gray-800 ">{route.duration}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                   <span className="text-xs text-gray-500  font-semibold uppercase block mb-1">Scanner Phone</span>
                   <a href={`tel:${route.scannerPhone.replace(/-/g, '')}`} className="flex items-center gap-2 text-blue-600  bg-blue-50  p-2 rounded-lg font-medium justify-center">
                      📞 {route.scannerPhone}
                   </a>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500  font-semibold uppercase">Locations ({route.stops.length})</span>
                    {route.stops.length > 0 && <NavDropdownMenu stops={route.stops} isDesktop={false} />}
                  </div>
                  <div className="space-y-3 bg-gray-50  p-3 rounded-lg border border-gray-100 ">
                    {route.stops.map((stop, idx) => (
                      <div key={idx} className="pb-2 mb-2 border-b border-gray-200  last:border-0 last:mb-0 last:pb-0">
                        <p className="font-bold text-gray-800  text-sm">{stop.name}</p>
                        <p className="text-xs text-gray-600  mb-1">{stop.address}</p>
                        <a href={`tel:${stop.phone.replace(/-/g, '')}`} className="text-xs text-blue-600  font-medium hover:underline">
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
              <thead className="bg-gray-50  border-b border-gray-200 ">
                <tr>
                  <th className="p-4 font-semibold text-gray-700 ">Route ID</th>
                  <th className="p-4 font-semibold text-gray-700 ">Region</th>
                  <th className="p-4 font-semibold text-gray-700 ">Scanner Ph. No.</th>
                  <th className="p-4 font-semibold text-gray-700 ">Locations Info</th>
                  <th className="p-4 font-semibold text-gray-700 ">Est. Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 ">
                {finalRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50  align-top transition-colors">
                    <td className="p-4 font-medium text-red-600 ">{route.id}</td>
                    <td className={`p-4 font-bold ${route.regionColor}`}>{route.region}</td>
                    <td className="p-4 text-gray-800 ">
                      <a href={`tel:${route.scannerPhone.replace(/-/g, '')}`} className="hover:text-blue-600  hover:underline">
                        {route.scannerPhone}
                      </a>
                    </td>
                    <td className="p-4 text-gray-600 ">
                      <div className="mb-4">
                        {route.stops.length > 0 && <NavDropdownMenu stops={route.stops} isDesktop={true} />}
                      </div>
                      <div className="space-y-4">
                        {route.stops.map((stop, idx) => (
                          <div key={idx}>
                            <span className="font-bold text-gray-800  block">{stop.name}</span>
                            <span className="text-xs block">{stop.address}</span>
                            <a href={`tel:${stop.phone.replace(/-/g, '')}`} className="text-xs text-blue-600  hover:underline">
                              {stop.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 ">{route.duration}</td>
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