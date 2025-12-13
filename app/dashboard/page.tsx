"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// --- CONFIGURATION: THE INSPECTION QUESTIONS ---
const QUESTIONS = [
  "Interior clean of debris, bins organised in trunk, up to 3 yellow bags on passenger seat",
  "Fuel Tank Full",
  "Gas card in binder",
  "Dashboard warning lights on",
  "Horn works",
  "HVAC systems working",
  "Info/Entertainment systems working",
  "All doors working",
  "Interior lights working",
  "Driver/Passenger seat and belts working",
  "Windshield wipers working",
  "Cracks/chips on any windows",
  "Dings, dents, or other visible damage on interior/exterior",
  "Headlights working",
  "Brake lights working",
  "Turn signals working",
  "Hazard lights working",
  "Fog lights working"
];

const DAMAGE_QUESTIONS = [
  "Dings, dents, or other visible damage on interior/exterior",
  "Cracks/chips on any windows",
  "Dashboard warning lights on"
];

// Define Trip Log Shape
type TripLog = {
  id: number;
  created_at: string;
  updated_at: string; 
  edit_count: number; 
  user_id: string; 
  vehicle_id: string;
  route_id: string; 
  odometer: number;
  trip_type: string;
  notes: string;
  checklist: Record<string, string>; 
  images: Record<string, string>; 
  driver_name?: string; 
};

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
  
  // Loading States
  const [loading, setLoading] = useState(true); // Initial data load
  const [submitting, setSubmitting] = useState(false); // New: Form submission state

  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  // Form State
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({});
  
  const [imageFiles, setImageFiles] = useState<{
    front: File | null;
    back: File | null;
    trunk: File | null;
  }>({ front: null, back: null, trunk: null });

  // --- LOGIC HELPERS ---

  const requiresDescription = (question: string, answer: string) => {
    if (!answer) return false;
    if (DAMAGE_QUESTIONS.includes(question)) {
      return answer === "Yes";
    }
    return answer === "No";
  };

  const canEditOrDelete = (log: TripLog) => {
    if (!userProfile) return false;
    if (userProfile.role === 'Admin') return true;
    if (userProfile.role === 'Management') return false;
    if (log.user_id !== userProfile.id) return false;

    const now = new Date().getTime();
    if (log.edit_count === 0) {
      const created = new Date(log.created_at).getTime();
      return (now - created) < (15 * 60 * 1000); 
    }
    if (log.edit_count === 1) {
      const updated = new Date(log.updated_at).getTime();
      return (now - updated) < (5 * 60 * 1000); 
    }
    return false; 
  };

  // --- EXPORT HELPERS ---
  const downloadCSV = (log: TripLog) => {
    const headers = [
      'Log ID', 'Date', 'Time', 'Driver', 'Trip Type', 'Route', 'Odometer', 'Notes', 'Img Front', 'Img Back', 'Img Trunk', 'Edits', 
      ...QUESTIONS 
    ];
    const dateObj = new Date(log.created_at);
    
    const checklistValues = QUESTIONS.map(q => {
      const val = log.checklist?.[q] || "N/A";
      const comment = log.checklist?.[`${q}_COMMENT`];
      return comment ? `"${val}: ${comment}"` : val;
    });

    const row = [
      log.id,
      dateObj.toLocaleDateString(),
      dateObj.toLocaleTimeString(),
      `"${log.driver_name || 'Unknown'}"`,
      log.trip_type,
      log.route_id || 'N/A',
      log.odometer,
      `"${(log.notes || '').replace(/"/g, '""')}"`,
      log.images?.front || "N/A",
      log.images?.back || "N/A",
      log.images?.trunk || "N/A",
      log.edit_count,
      ...checklistValues
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

    const checklistRows = QUESTIONS.map(q => {
      const val = log.checklist?.[q] || "-";
      const comment = log.checklist?.[`${q}_COMMENT`];
      
      let isBad = false;
      if (DAMAGE_QUESTIONS.includes(q)) isBad = (val === "Yes");
      else isBad = (val === "No");

      let displayHtml = `<span style="font-weight:bold;color:${isBad ? "red" : "green"}">${val}</span>`;
      if (comment) displayHtml += `<br/><span style="font-size:11px; color:#c00;">Note: ${comment}</span>`;

      return `<tr><td style="padding:5px;border-bottom:1px solid #eee;">${q}</td><td style="padding:5px;border-bottom:1px solid #eee;">${displayHtml}</td></tr>`;
    }).join('');
    
    printWindow.document.write(`
      <html>
        <head><title>Log #${log.id}</title></head>
        <body style="font-family:sans-serif;padding:40px;">
          <h1 style="border-bottom:2px solid #333;">${log.trip_type} Report</h1>
          <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
            <div><strong>Driver:</strong> ${log.driver_name || 'Unknown'}</div>
            <div><strong>Date:</strong> ${new Date(log.created_at).toLocaleString()}</div>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
             <div><strong>Route:</strong> ${log.route_id || "N/A"}</div>
             <div><strong>Odometer:</strong> ${log.odometer}</div>
          </div>
          <h3>Photos</h3>
          <div style="display:flex; gap:10px; margin-bottom:20px;">
             ${log.images?.front ? `<div style="flex:1"><p>Front</p><img src="${log.images.front}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
             ${log.images?.back ? `<div style="flex:1"><p>Back</p><img src="${log.images.back}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
             ${log.images?.trunk ? `<div style="flex:1"><p>Trunk</p><img src="${log.images.trunk}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
          </div>
          <h3>Inspection Checklist</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">
            ${checklistRows}
          </table>
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
    setImageFiles({ front: null, back: null, trunk: null });

    const answers: Record<string, string> = {};
    const comments: Record<string, string> = {};
    
    if (log.checklist) {
      Object.keys(log.checklist).forEach(key => {
        if (key.endsWith('_COMMENT')) {
          const realKey = key.replace('_COMMENT', '');
          comments[realKey] = log.checklist[key];
        } else {
          answers[key] = log.checklist[key];
        }
      });
    }
    setChecklistData(answers);
    setChecklistComments(comments);
    setActiveTab('new');
  };

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

  const handleChecklistChange = (question: string, value: string) => {
    setChecklistData(prev => ({ ...prev, [question]: value }));
  };
  const handleCommentChange = (question: string, comment: string) => {
    setChecklistComments(prev => ({ ...prev, [question]: comment }));
  };
  const handleFileChange = (key: 'front' | 'back' | 'trunk', file: File | null) => {
    setImageFiles(prev => ({ ...prev, [key]: file }));
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${userProfile?.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('trip_logs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('trip_logs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- SUBMIT / UPDATE ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userProfile) return;

    // <-- FIX: Capture form element immediately before any async/await calls
    const formElement = e.currentTarget; 
    const formData = new FormData(formElement);

    setSubmitting(true); // START SPINNER

    try {
      // --- UPLOAD IMAGES ---
      let imageUrls = editingLog?.images || { front: "", back: "", trunk: "" };

      if (imageFiles.front) {
        const url = await uploadImage(imageFiles.front);
        imageUrls = { ...imageUrls, front: url };
      }
      if (imageFiles.back) {
        const url = await uploadImage(imageFiles.back);
        imageUrls = { ...imageUrls, back: url };
      }
      if (imageFiles.trunk) {
        const url = await uploadImage(imageFiles.trunk);
        imageUrls = { ...imageUrls, trunk: url };
      }

      // --- PREPARE DATA ---
      // Note: We use the already captured 'formData' variable here
      const finalChecklist = { ...checklistData };
      
      Object.keys(checklistComments).forEach(q => {
        const answer = checklistData[q];
        if (requiresDescription(q, answer) && checklistComments[q]) {
          finalChecklist[`${q}_COMMENT`] = checklistComments[q];
        }
      });

      const baseData = {
        vehicle_id: "N/A", 
        route_id: formData.get('route_id'), 
        odometer: formData.get('odometer'),
        trip_type: formData.get('trip_type'),
        notes: formData.get('notes'),
        checklist: finalChecklist,
        images: imageUrls, 
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
        formElement.reset(); // Use the captured element to reset
        setChecklistData({}); 
        setChecklistComments({});
        setImageFiles({ front: null, back: null, trunk: null });
        setEditingLog(null); 
        fetchData(); 
        setActiveTab('history'); 
      }
    } catch (err) {
      // Cast err as Error to satisfy TypeScript
      const errorMessage = (err as Error).message || "An unknown error occurred";
      alert("Submission Failed: " + errorMessage);
    } finally {
      setSubmitting(false); // STOP SPINNER
    }
  }

  const visibleLogs = (activeTab === 'history')
    ? logs.filter(log => log.user_id === userProfile?.id) 
    : logs;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
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

      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
        <button onClick={() => { setActiveTab('new'); setEditingLog(null); setChecklistData({}); setChecklistComments({}); setImageFiles({front:null, back:null, trunk:null}); }} className={`px-6 py-3 font-medium ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
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

      {activeTab === 'new' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
          <h2 className="text-xl font-semibold mb-6">
            {editingLog ? `Editing Log #${editingLog.id}` : "Submit New Pre/Post Trip Inspection"}
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Trip Type</span>
              <select name="trip_type" defaultValue={editingLog?.trip_type} className="border p-3 rounded bg-white" required>
                <option value="Pre-Trip">Pre-Trip Inspection</option>
                <option value="Post-Trip">Post-Trip Inspection</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Select Route</span>
              <select name="route_id" defaultValue={editingLog?.route_id || ""} className="border p-3 rounded-lg bg-white" required>
                <option value="" disabled>-- Choose a Route --</option>
                <option value="R-101">Route 101 (North Shore)</option>
                <option value="R-102">Route 102 (Metro West)</option>
                <option value="R-103">Route 103 (South Shore)</option>
                <option value="Unassigned">Unassigned / Float</option>
              </select>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Odometer</span>
              <input name="odometer" type="number" defaultValue={editingLog?.odometer} className="border p-3 rounded" required />
            </label>

            <hr className="border-gray-200" />
            
            <div>
               <h3 className="text-lg font-bold text-gray-800 mb-4">Inspection Checklist</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                 {QUESTIONS.map((question, index) => {
                   const answer = checklistData[question];
                   const showComment = requiresDescription(question, answer);
                   const isBad = showComment;
                   return (
                     <div key={index} className={`flex flex-col bg-gray-50 p-3 rounded border ${isBad ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-sm text-gray-700 font-medium max-w-[70%]">{question}</span>
                         <div className="flex gap-4">
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="Yes" checked={answer === "Yes"} onChange={() => handleChecklistChange(question, "Yes")} className="accent-green-600 w-4 h-4" required />
                             <span className="text-sm">Yes</span>
                           </label>
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="No" checked={answer === "No"} onChange={() => handleChecklistChange(question, "No")} className="accent-red-600 w-4 h-4" />
                             <span className="text-sm">No</span>
                           </label>
                         </div>
                       </div>
                       {showComment && (
                         <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                           <input type="text" placeholder="Describe issue (Required)" value={checklistComments[question] || ""} onChange={(e) => handleCommentChange(question, e.target.value)} className="w-full text-sm border border-red-300 rounded p-2 focus:outline-none focus:border-red-500 text-red-700 placeholder-red-300 bg-white" required />
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Photos (Required)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Front Seats</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required={!editingLog?.images?.front} />
                  {editingLog?.images?.front && <a href={editingLog.images.front} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Back Seats</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required={!editingLog?.images?.back} />
                  {editingLog?.images?.back && <a href={editingLog.images.back} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Trunk</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange('trunk', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required={!editingLog?.images?.trunk} />
                  {editingLog?.images?.trunk && <a href={editingLog.images.trunk} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Additional Notes / Defects</span>
              <textarea name="notes" defaultValue={editingLog?.notes} className="border p-3 rounded" rows={3} placeholder="General notes..." />
            </label>
            
            {/* UPDATED SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={submitting} // DISABLE WHILE UPLOADING
              className={`font-bold py-3 px-6 rounded text-white flex items-center gap-2 transition-all ${
                submitting ? "bg-gray-400 cursor-wait" : (editingLog ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700')
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Images...
                </>
              ) : (
                editingLog ? "Update Log" : "Submit Log"
              )}
            </button>

          </form>
        </div>
      )}

      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Actions</th>
                  {activeTab === 'all' && <th className="p-4 font-semibold text-gray-700">Driver</th>}
                  <th className="p-4 font-semibold text-gray-700">Date</th>
                  <th className="p-4 font-semibold text-gray-700">Route</th>
                  <th className="p-4 font-semibold text-gray-700">Type</th>
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
                        <button onClick={() => printLog(log)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">📄</button>
                        <button onClick={() => downloadCSV(log)} className="text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded">📊</button>
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
                      <td className="p-4 font-medium text-gray-800">{log.route_id || "-"}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{log.trip_type}</span></td>
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
