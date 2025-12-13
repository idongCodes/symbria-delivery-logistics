"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Define the shape of a Trip Log
type TripLog = {
  id: number;
  created_at: string;
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

  // State for Editing
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  // --- HELPERS ---

  // Check if log is editable (created less than 30 mins ago)
  const isEditable = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const thirtyMins = 30 * 60 * 1000;
    return (now - created) < thirtyMins;
  };

  // 1. Download as CSV
  const downloadCSV = (log: TripLog) => {
    const headers = ['Log ID', 'Date', 'Time', 'Driver', 'Trip Type', 'Vehicle ID', 'Odometer', 'Notes'];
    const dateObj = new Date(log.created_at);
    
    const row = [
      log.id,
      dateObj.toLocaleDateString(),
      dateObj.toLocaleTimeString(),
      `"${log.driver_name || 'Unknown'}"`,
      log.trip_type,
      log.vehicle_id,
      log.odometer,
      `"${(log.notes || '').replace(/"/g, '""')}"`
    ];

    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trip_log_${log.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Print to PDF
  const printLog = (log: TripLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to print logs.");

    const html = `
      <html>
        <head>
          <title>Trip Log #${log.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: 150px 1fr; gap: 15px; margin-bottom: 30px; }
            .label { font-weight: bold; color: #444; }
            .notes-box { border: 1px solid #ddd; background: #f9f9f9; padding: 15px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>${log.trip_type} Report</h1>
          <div class="header">
            <div><strong>Driver:</strong> ${log.driver_name || 'Unknown'}</div>
            <div>${new Date(log.created_at).toLocaleString()}</div>
          </div>
          <div class="grid">
            <div class="label">Vehicle ID:</div><div>${log.vehicle_id}</div>
            <div class="label">Odometer:</div><div>${log.odometer}</div>
            <div class="label">Trip Type:</div><div>${log.trip_type}</div>
          </div>
          <div class="notes-box">
            <div class="label">Notes:</div>
            <p>${log.notes || "No notes."}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // 3. Handle Delete
  const handleDelete = async (logId: number) => {
    if (!confirm("Are you sure you want to delete this log? This cannot be undone.")) return;

    const { error } = await supabase.from('trip_logs').delete().eq('id', logId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Log deleted successfully.");
      fetchData();
    }
  };

  // 4. Handle Edit Click
  const handleEditClick = (log: TripLog) => {
    setEditingLog(log);
    setActiveTab('new');
  };

  // --- DATA LOADING ---
  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- SUBMIT / UPDATE ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userProfile) return;

    const formData = new FormData(e.currentTarget);
    const logData = {
      vehicle_id: formData.get('vehicle_id'),
      odometer: formData.get('odometer'),
      trip_type: formData.get('trip_type'),
      notes: formData.get('notes'),
      driver_name: `${userProfile.firstName} ${userProfile.lastName}`
    };

    let error;

    if (editingLog) {
      // UPDATE EXISTING
      const response = await supabase
        .from('trip_logs')
        .update(logData)
        .eq('id', editingLog.id);
      error = response.error;
    } else {
      // INSERT NEW
      const response = await supabase
        .from('trip_logs')
        .insert(logData);
      error = response.error;
    }

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert(editingLog ? "Log updated successfully!" : "Success! Log submitted.");
      e.currentTarget.reset(); 
      setEditingLog(null); // Clear edit mode
      fetchData(); 
      setActiveTab('history'); 
    }
  }

  // --- RENDER ---
  const visibleLogs = activeTab === 'history' 
    ? logs.filter(log => log.user_id === userProfile?.id) 
    : logs;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your data...</div>;

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
              userProfile.role === 'Management' ? 'border-purple-300 text-purple-600 bg-purple-50' : 'border-gray-300'
            }`}>
              {userProfile.role}
            </span>
          </h3>
        )}
      </header>

      {/* TABS */}
      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('new'); setEditingLog(null); }}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'new' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {editingLog ? `Editing Log #${editingLog.id}` : 'New Pre/Post Trip Form'}
        </button>
        <button
          onClick={() => { setActiveTab('history'); setEditingLog(null); }}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Submitted Logs
        </button>
        {userProfile?.role === 'Management' && (
          <button
            onClick={() => { setActiveTab('all'); setEditingLog(null); }}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'all' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            All Driver Logs (Admin)
          </button>
        )}
      </div>

      {/* FORM (NEW or EDIT) */}
      {activeTab === 'new' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingLog ? `Editing Log #${editingLog.id}` : "Submit New Log"}
            </h2>
            {editingLog && (
              <button 
                onClick={() => { setEditingLog(null); }}
                className="text-sm text-red-600 hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
          
          <form key={editingLog ? editingLog.id : 'new'} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Trip Type</span>
                <select name="trip_type" defaultValue={editingLog?.trip_type} className="border p-3 rounded-lg bg-white" required>
                  <option value="Pre-Trip">Pre-Trip Inspection</option>
                  <option value="Post-Trip">Post-Trip Inspection</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-700">Vehicle ID</span>
                <input name="vehicle_id" type="text" defaultValue={editingLog?.vehicle_id} placeholder="Ex: Van-104" className="border p-3 rounded-lg" required />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Current Odometer</span>
              <input name="odometer" type="number" defaultValue={editingLog?.odometer} placeholder="000000" className="border p-3 rounded-lg" required />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Notes / Issues</span>
              <textarea name="notes" defaultValue={editingLog?.notes} placeholder="Notes..." className="border p-3 rounded-lg" rows={3} />
            </label>
            <button type="submit" className={`font-bold py-3 px-6 rounded-lg transition self-start text-white ${editingLog ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {editingLog ? "Update Log" : "Submit Log"}
            </button>
          </form>
        </div>
      )}

      {/* LIST VIEWS */}
      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {visibleLogs.length === 0 ? <div className="p-8 text-center text-gray-500">No logs found.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {(activeTab === 'all' || activeTab === 'history') && <th className="p-4 font-semibold text-gray-700">Actions</th>}
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
                      
                      {/* ACTIONS */}
                      <td className="p-4">
                        {activeTab === 'all' ? (
                          <div className="flex gap-2">
                            <button onClick={() => printLog(log)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">📄 PDF</button>
                            <button onClick={() => downloadCSV(log)} className="text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded">📊 CSV</button>
                          </div>
                        ) : (
                          // History Tab Actions (Edit/Delete)
                          isEditable(log.created_at) ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleEditClick(log)} className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded">✏️ Edit</button>
                              <button onClick={() => handleDelete(log.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded">🗑️ Delete</button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Locked</span>
                          )
                        )}
                      </td>

                      {activeTab === 'all' && <td className="p-4 font-medium text-gray-900">{log.driver_name || "Unknown"}</td>}
                      <td className="p-4 text-gray-600">{new Date(log.created_at).toLocaleDateString()} <br/><span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</span></td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{log.trip_type}</span></td>
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
