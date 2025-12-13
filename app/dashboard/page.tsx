"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Define the shape of a Trip Log
type TripLog = {
  id: number;
  created_at: string;
  updated_at: string; 
  edit_count: number; 
  user_id: string; 
  vehicle_id: string;
  odometer: number;
  trip_type: string;
  notes: string;
  driver_name?: string; 
};

// Define User Profile shape
type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'Driver' | 'Management' | 'Admin';
  email: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all'>('new');
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  // --- LOGIC HELPERS ---

  // REVISED PERMISSION LOGIC
  const canEditOrDelete = (log: TripLog) => {
    if (!userProfile) return false;

    // 1. ADMIN OVERRIDE: Admins can delete/edit ANYTHING at ANYTIME
    if (userProfile.role === 'Admin') return true;

    // 2. MANAGEMENT: Read-only (cannot edit/delete)
    if (userProfile.role === 'Management') return false;

    // 3. DRIVERS: Can only edit their own logs within the time window
    if (log.user_id !== userProfile.id) return false;

    const now = new Date().getTime();
    if (log.edit_count === 0) {
      const created = new Date(log.created_at).getTime();
      return (now - created) < (15 * 60 * 1000); // 15 mins
    }
    if (log.edit_count === 1) {
      const updated = new Date(log.updated_at).getTime();
      return (now - updated) < (5 * 60 * 1000); // 5 mins
    }
    return false; // Locked after 2nd edit
  };

  // --- EXPORT HELPERS ---
  const downloadCSV = (log: TripLog) => {
    const headers = ['Log ID', 'Date', 'Time', 'Driver', 'Trip Type', 'Vehicle ID', 'Odometer', 'Notes', 'Edits'];
    const dateObj = new Date(log.created_at);
    
    const row = [
      log.id,
      dateObj.toLocaleDateString(),
      dateObj.toLocaleTimeString(),
      `"${log.driver_name || 'Unknown'}"`,
      log.trip_type,
      log.vehicle_id,
      log.odometer,
      `"${(log.notes || '').replace(/"/g, '""')}"`,
      log.edit_count
    ];

    const blob = new Blob([[headers.join(','), row.join(',')].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `trip_log_${log.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printLog = (log: TripLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups.");
    
    printWindow.document.write(`
      <html>
        <head><title>Log #${log.id}</title></head>
        <body style="font-family:sans-serif;padding:40px;">
          <h1 style="border-bottom:2px solid #333;">${log.trip_type} Report</h1>
          <p><strong>Driver:</strong> ${log.driver_name || 'Unknown'}</p>
          <p><strong>Vehicle:</strong> ${log.vehicle_id} | <strong>Odo:</strong> ${log.odometer}</p>
          <p style="background:#f4f4f4;padding:15px;border:1px solid #ddd;"><strong>Notes:</strong><br/>${log.notes || "None"}</p>
          <script>window.onload=function(){window.print();}</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDelete = async (logId: number) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    const { error } = await supabase.from('trip_logs').delete().eq('id', logId);
    if (error) alert("Error: " + error.message);
    else { alert("Log deleted."); fetchData(); }
  };

  const handleEditClick = (log: TripLog) => {
    setEditingLog(log);
    setActiveTab('new');
  };

  // --- DATA LOADING ---
  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { user } = session;
      const metadata = user.user_metadata || {};

      setUserProfile({
        id: user.id,
        email: user.email || "",
        firstName: metadata.first_name || "",
        lastName: metadata.last_name || "",
        role: metadata.role || "Driver",
      });

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- SUBMIT / UPDATE ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userProfile) return;

    const formData = new FormData(e.currentTarget);
    const baseData = {
      vehicle_id: formData.get('vehicle_id'),
      odometer: formData.get('odometer'),
      trip_type: formData.get('trip_type'),
      notes: formData.get('notes'),
      driver_name: `${userProfile.firstName} ${userProfile.lastName}`
    };

    let error;

    if (editingLog) {
      const response = await supabase
        .from('trip_logs')
        .update({
          ...baseData,
          edit_count: editingLog.edit_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLog.id);
      error = response.error;
    } else {
      const response = await supabase.from('trip_logs').insert(baseData);
      error = response.error;
    }

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert(editingLog ? "Log updated!" : "Success! Log submitted.");
      e.currentTarget.reset(); 
      setEditingLog(null); 
      fetchData(); 
      setActiveTab('history'); 
    }
  }

  // --- RENDER ---
  const visibleLogs = (activeTab === 'history')
    ? logs.filter(log => log.user_id === userProfile?.id) 
    : logs;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {userProfile?.firstName}</p>
        </div>
        {userProfile && (
          <h3 className="text-gray-400 text-right font-medium">
            {userProfile.firstName} {userProfile.lastName} <br />
            <span className={`uppercase text-xs tracking-wider border px-2 py-0.5 rounded-full mt-1 inline-block ${
              userProfile.role === 'Admin' ? 'border-red-300 text-red-600 bg-red-50' : 
              userProfile.role === 'Management' ? 'border-purple-300 text-purple-600 bg-purple-50' : 
              'border-gray-300'
            }`}>
              {userProfile.role}
            </span>
          </h3>
        )}
      </header>

      {/* TABS */}
      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
        <button onClick={() => { setActiveTab('new'); setEditingLog(null); }} className={`px-6 py-3 font-medium ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          {editingLog ? `Editing #${editingLog.id}` : 'New Form'}
        </button>
        <button onClick={() => { setActiveTab('history'); setEditingLog(null); }} className={`px-6 py-3 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          My Logs
        </button>
        {(userProfile?.role === 'Management' || userProfile?.role === 'Admin') && (
          <button onClick={() => { setActiveTab('all'); setEditingLog(null); }} className={`px-6 py-3 font-medium ${activeTab === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>
            All Logs (Admin)
          </button>
        )}
      </div>

      {/* FORM */}
      {activeTab === 'new' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl">
          <h2 className="text-xl font-semibold mb-4">{editingLog ? `Editing Log #${editingLog.id}` : "Submit New Log"}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Trip Type</span>
                <select name="trip_type" defaultValue={editingLog?.trip_type} className="border p-3 rounded bg-white" required>
                  <option value="Pre-Trip">Pre-Trip Inspection</option>
                  <option value="Post-Trip">Post-Trip Inspection</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Vehicle ID</span>
                <input name="vehicle_id" type="text" defaultValue={editingLog?.vehicle_id} className="border p-3 rounded" required />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Odometer</span>
              <input name="odometer" type="number" defaultValue={editingLog?.odometer} className="border p-3 rounded" required />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Notes</span>
              <textarea name="notes" defaultValue={editingLog?.notes} className="border p-3 rounded" rows={3} />
            </label>
            <button type="submit" className={`font-bold py-3 px-6 rounded text-white ${editingLog ? 'bg-orange-600' : 'bg-green-600'}`}>
              {editingLog ? "Update Log" : "Submit Log"}
            </button>
          </form>
        </div>
      )}

      {/* TABLES */}
      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Actions</th>
                  {activeTab === 'all' && <th className="p-4 font-semibold text-gray-700">Driver</th>}
                  <th className="p-4 font-semibold text-gray-700">Date</th>
                  <th className="p-4 font-semibold text-gray-700">Type</th>
                  <th className="p-4 font-semibold text-gray-700">Vehicle</th>
                  <th className="p-4 font-semibold text-gray-700">Odo</th>
                  <th className="p-4 font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleLogs.map((log) => {
                  const hasPermission = canEditOrDelete(log);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4 flex gap-2">
                        {/* VIEW/EXPORT Buttons (Always visible here) */}
                        <button onClick={() => printLog(log)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">📄</button>
                        <button onClick={() => downloadCSV(log)} className="text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded">📊</button>
                        
                        {/* EDIT/DELETE Buttons (Permission Check) */}
                        {hasPermission && (
                          <>
                            <div className="w-px h-4 bg-gray-300 mx-1 self-center"></div>
                            <button onClick={() => handleEditClick(log)} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">✏️</button>
                            <button onClick={() => handleDelete(log.id)} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">🗑️</button>
                          </>
                        )}
                      </td>
                      {activeTab === 'all' && <td className="p-4 font-medium">{log.driver_name}</td>}
                      <td className="p-4 text-gray-600">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{log.trip_type}</span></td>
                      <td className="p-4">{log.vehicle_id}</td>
                      <td className="p-4">{log.odometer}</td>
                      <td className="p-4 text-gray-500 truncate max-w-xs">{log.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
