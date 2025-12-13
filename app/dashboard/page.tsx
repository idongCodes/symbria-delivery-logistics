"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Define the shape of a Trip Log
type TripLog = {
  id: number;
  created_at: string;
  user_id: string; // Needed for filtering
  vehicle_id: string;
  odometer: number;
  trip_type: string;
  notes: string;
  driver_name?: string; // Optional (for older logs)
};

// Define User Profile shape
type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  // State for Tabs
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all'>('new');
  
  // State for Data
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check Auth & Fetch Data
  const fetchData = useCallback(async () => {
    try {
      // 1. Get User Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // 2. Extract Metadata
      const { user } = session;
      const metadata = user.user_metadata || {};

      setUserProfile({
        id: user.id,
        email: user.email || "",
        firstName: metadata.first_name || "",
        lastName: metadata.last_name || "",
        role: metadata.role || "Driver",
      });

      // 3. Get Logs (RLS determines what we get back)
      // If Driver -> Gets only own logs
      // If Manager -> Gets ALL logs
      const { data, error } = await supabase
        .from('trip_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Submit Handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userProfile) return;

    const formData = new FormData(e.currentTarget);
    
    const newLog = {
      vehicle_id: formData.get('vehicle_id'),
      odometer: formData.get('odometer'),
      trip_type: formData.get('trip_type'),
      notes: formData.get('notes'),
      driver_name: `${userProfile.firstName} ${userProfile.lastName}` // Save name for Managers to see
    };

    const { error } = await supabase.from('trip_logs').insert(newLog);

    if (error) {
      alert("Error submitting log: " + error.message);
    } else {
      alert("Success! Log submitted.");
      e.currentTarget.reset(); 
      fetchData(); 
      setActiveTab('history'); 
    }
  }

  // Determine which logs to show based on active tab
  const visibleLogs = activeTab === 'history' 
    ? logs.filter(log => log.user_id === userProfile?.id) // Only show mine
    : logs; // Show all (for Management tab)

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your data...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      {/* --- HEADER --- */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {userProfile?.email}</p>
        </div>
        
        {userProfile && (
          <h3 className="text-gray-400 text-right font-medium">
            {userProfile.firstName} {userProfile.lastName} <br />
            <span className={`uppercase text-xs tracking-wider border px-2 py-0.5 rounded-full mt-1 inline-block ${
              userProfile.role === 'Management' ? 'border-purple-300 text-purple-600 bg-purple-50' : 'border-gray-300'
            }`}>
              {userProfile.role}
            </span>
          </h3>
        )}
      </header>

      {/* --- TABS --- */}
      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'new' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          New Pre/Post Trip Form
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Submitted Logs
        </button>

        {/* --- MANAGEMENT TAB --- */}
        {userProfile?.role === 'Management' && (
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'all' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            All Driver Logs (Admin)
          </button>
        )}
      </div>

      {/* --- TAB CONTENT: NEW FORM --- */}
      {activeTab === 'new' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl">
          <h2 className="text-xl font-semibold mb-4">Submit New Log</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Trip Type</span>
                <select name="trip_type" className="border p-3 rounded-lg bg-white" required>
                  <option value="Pre-Trip">Pre-Trip Inspection</option>
                  <option value="Post-Trip">Post-Trip Inspection</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Vehicle ID</span>
                <input name="vehicle_id" type="text" placeholder="Ex: Van-104" className="border p-3 rounded-lg" required />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Current Odometer</span>
              <input name="odometer" type="number" placeholder="000000" className="border p-3 rounded-lg" required />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Notes / Issues</span>
              <textarea name="notes" placeholder="Any damage, maintenance needs, or comments..." className="border p-3 rounded-lg" rows={3} />
            </label>

            <button type="submit" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition self-start">
              Submit Log
            </button>
          </form>
        </div>
      )}

      {/* --- TAB CONTENT: LISTS (History & All) --- */}
      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {visibleLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* Show Driver Name column ONLY on "All Logs" tab */}
                    {activeTab === 'all' && <th className="p-4 font-semibold text-gray-700">Driver</th>}
                    <th className="p-4 font-semibold text-gray-700">Date</th>
                    <th className="p-4 font-semibold text-gray-700">Type</th>
                    <th className="p-4 font-semibold text-gray-700">Vehicle</th>
                    <th className="p-4 font-semibold text-gray-700">Odometer</th>
                    <th className="p-4 font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      
                      {activeTab === 'all' && (
                        <td className="p-4 font-medium text-gray-900">
                          {log.driver_name || "Unknown"}
                        </td>
                      )}

                      <td className="p-4 text-gray-600">
                        {new Date(log.created_at).toLocaleDateString()} <br/>
                        <span className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {log.trip_type}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-800">{log.vehicle_id}</td>
                      <td className="p-4 text-gray-600">{log.odometer}</td>
                      <td className="p-4 text-gray-500 max-w-xs truncate">{log.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
