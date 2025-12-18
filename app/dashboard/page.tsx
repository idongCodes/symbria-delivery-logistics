"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// --- CONFIGURATION: QUESTIONS LISTS ---

const PRE_TRIP_QUESTIONS = [
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

const POST_TRIP_QUESTIONS = [
  "Fuel Tank Full",
  "Interior clean of debris, bins organised in trunk, up to 3 yellow bags on passenger seat",
  "Synchronize Scanner, End Route, Log Off",
  "Scanner returned",
  "Tackle boxes returned"
];

const ALL_QUESTIONS_MASTER = Array.from(new Set([...PRE_TRIP_QUESTIONS, ...POST_TRIP_QUESTIONS]));

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

// Shape for Dynamic Routes
type RouteOption = {
  id: number;
  name: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all'>('new');
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [loading, setLoading] = useState(true); 
  const [submitting, setSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  // Form State
  const [tripType, setTripType] = useState<string>("Pre-Trip");
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({});
  const [tirePressures, setTirePressures] = useState({
    df: "", pf: "", dr: "", pr: ""
  });
  
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

  const downloadCSV = (log: TripLog) => {
    const headers = [
      'Log ID', 'Date', 'Time', 'Driver', 'Trip Type', 'Route', 'Odometer', 
      'Tire DF', 'Tire PF', 'Tire DR', 'Tire PR', 
      'Notes', 'Img Front', 'Img Back', 'Img Trunk', 'Edits', 
      ...ALL_QUESTIONS_MASTER 
    ];

    const dateObj = new Date(log.created_at);
    
    const checklistValues = ALL_QUESTIONS_MASTER.map(q => {
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
      log.checklist?.["Tire Pressure (Driver Front)"] || "N/A",
      log.checklist?.["Tire Pressure (Passenger Front)"] || "N/A",
      log.checklist?.["Tire Pressure (Driver Rear)"] || "N/A",
      log.checklist?.["Tire Pressure (Passenger Rear)"] || "N/A",
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

    const relevantQuestions = log.trip_type === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;

    const checklistRows = relevantQuestions.map(q => {
      const val = log.checklist?.[q] || "-";
      const comment = log.checklist?.[`${q}_COMMENT`];
      
      let isBad = false;
      if (DAMAGE_QUESTIONS.includes(q)) isBad = (val === "Yes");
      else isBad = (val === "No");

      let displayHtml = `<span style="font-weight:bold;color:${isBad ? "red" : "green"}">${val}</span>`;
      if (comment) displayHtml += `<br/><span style="font-size:11px; color:#c00;">Note: ${comment}</span>`;
      return `<tr><td style="padding:5px;border-bottom:1px solid #eee;">${q}</td><td style="padding:5px;border-bottom:1px solid #eee;">${displayHtml}</td></tr>`;
    }).join('');
    
    let tireHtml = "";
    if (log.trip_type === 'Pre-Trip') {
      const tDF = log.checklist?.["Tire Pressure (Driver Front)"] || "-";
      const tPF = log.checklist?.["Tire Pressure (Passenger Front)"] || "-";
      const tDR = log.checklist?.["Tire Pressure (Driver Rear)"] || "-";
      const tPR = log.checklist?.["Tire Pressure (Passenger Rear)"] || "-";
      tireHtml = `<h3>Tire Pressure (PSI)</h3><table style="width:100%; border:1px solid #ddd; margin-bottom:20px; text-align:center;"><tr style="background:#f4f4f4;"><th>D-Front</th><th>P-Front</th><th>D-Rear</th><th>P-Rear</th></tr><tr><td>${tDF}</td><td>${tPF}</td><td>${tDR}</td><td>${tPR}</td></tr></table>`;
    }

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
          ${tireHtml}
          <h3>Photos</h3>
          <div style="display:flex; gap:10px; margin-bottom:20px;">
             ${log.images?.front ? `<div style="flex:1"><p>Front</p><img src="${log.images.front}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
             ${log.images?.back ? `<div style="flex:1"><p>Back</p><img src="${log.images.back}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
             ${log.images?.trunk ? `<div style="flex:1"><p>Trunk</p><img src="${log.images.trunk}" style="width:100%; border:1px solid #ddd;"/></div>` : ''}
          </div>
          <h3>Inspection Checklist</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">${checklistRows}</table>
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
    setTripType(log.trip_type);
    setImageFiles({ front: null, back: null, trunk: null });

    const answers: Record<string, string> = {};
    const comments: Record<string, string> = {};
    
    if (log.checklist) {
      setTirePressures({
        df: log.checklist["Tire Pressure (Driver Front)"] || "",
        pf: log.checklist["Tire Pressure (Passenger Front)"] || "",
        dr: log.checklist["Tire Pressure (Driver Rear)"] || "",
        pr: log.checklist["Tire Pressure (Passenger Rear)"] || "",
      });

      Object.keys(log.checklist).forEach(key => {
        if (key.includes("Tire Pressure")) return;
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

  // --- UPDATED FETCH LOGIC (Routes First) ---
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

      // 1. Fetch Routes FIRST to prevent dropdown blocking
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (routeError) console.error("Route Error:", routeError);
      if (routeData) setRouteOptions(routeData);

      // 2. Fetch Logs SECOND
      const { data: logsData, error: logsError } = await supabase
        .from('trip_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (logsError) throw logsError;
      setLogs(logsData || []);

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChecklistChange = (question: string, value: string) => setChecklistData(prev => ({ ...prev, [question]: value }));
  const handleCommentChange = (question: string, comment: string) => setChecklistComments(prev => ({ ...prev, [question]: comment }));
  const handleFileChange = (key: 'front' | 'back' | 'trunk', file: File | null) => setImageFiles(prev => ({ ...prev, [key]: file }));
  const handleTireChange = (key: 'df' | 'pf' | 'dr' | 'pr', value: string) => setTirePressures(prev => ({ ...prev, [key]: value }));
  
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${userProfile?.id}/${fileName}`;
    const { error } = await supabase.storage.from('trip_logs').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('trip_logs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userProfile) return;

    const formElement = e.currentTarget; 
    const formData = new FormData(formElement);
    setSubmitting(true);
    
    try {
      // 1. Upload Images (shallow copy old list first)
      const imageUrls = { ...(editingLog?.images || { front: "", back: "", trunk: "" }) };
      if (imageFiles.front) imageUrls.front = await uploadImage(imageFiles.front);
      if (imageFiles.back) imageUrls.back = await uploadImage(imageFiles.back);
      if (imageFiles.trunk) imageUrls.trunk = await uploadImage(imageFiles.trunk);

      // 2. Prepare Data
      const finalChecklist = { ...checklistData };
      Object.keys(checklistComments).forEach(q => {
        const answer = checklistData[q];
        if (requiresDescription(q, answer) && checklistComments[q]) {
          finalChecklist[`${q}_COMMENT`] = checklistComments[q];
        }
      });

      if (tripType === 'Pre-Trip') {
        finalChecklist["Tire Pressure (Driver Front)"] = tirePressures.df;
        finalChecklist["Tire Pressure (Passenger Front)"] = tirePressures.pf;
        finalChecklist["Tire Pressure (Driver Rear)"] = tirePressures.dr;
        finalChecklist["Tire Pressure (Passenger Rear)"] = tirePressures.pr;
      }

      // --- CRITICAL FIX: Add user_id to baseData ---
      const baseData = {
        user_id: userProfile.id, // <--- THIS LINE WAS ADDED
        vehicle_id: "N/A", 
        route_id: formData.get('route_id'), 
        odometer: formData.get('odometer'),
        trip_type: tripType, 
        notes: formData.get('notes'),
        checklist: finalChecklist,
        images: imageUrls, 
        driver_name: `${userProfile.firstName} ${userProfile.lastName}`
      };

      let error;
      if (editingLog) {
        const response = await supabase.from('trip_logs').update({
            ...baseData,
            edit_count: editingLog.edit_count + 1,
            updated_at: new Date().toISOString()
        }).eq('id', editingLog.id);
        error = response.error;
      } else {
        const response = await supabase.from('trip_logs').insert(baseData);
        error = response.error;
      }

      if (error) {
        alert("Error: " + error.message);
      } else {
        alert(editingLog ? "Log updated!" : "Success! Log submitted.");
        formElement.reset();
        setChecklistData({});
        setChecklistComments({});
        setImageFiles({ front: null, back: null, trunk: null });
        setTirePressures({ df: "", pf: "", dr: "", pr: "" });
        setTripType("Pre-Trip");
        setEditingLog(null); 
        fetchData(); 
        setActiveTab('history'); 
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "An unknown error occurred";
      alert("Submission Failed: " + errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  const visibleLogs = (activeTab === 'history')
    ? logs.filter(log => log.user_id === userProfile?.id) 
    : logs;

  const currentQuestions = tripType === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {userProfile?.firstName}</p>
        </div>
        {userProfile && (
          <h3 className="text-gray-400 font-medium text-left md:text-right">
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

      <div className="flex border-b border-gray-300 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <button onClick={() => { setActiveTab('new');
          setEditingLog(null); setChecklistData({}); setChecklistComments({}); setImageFiles({front:null, back:null, trunk:null}); setTirePressures({df:"", pf:"", dr:"", pr:""}); setTripType("Pre-Trip");
        }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          {editingLog ? `Editing #${editingLog.id}` : 'New Form'}
        </button>
        <button onClick={() => { setActiveTab('history');
          setEditingLog(null); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
          My Logs
        </button>
        {(userProfile?.role === 'Management' || userProfile?.role === 'Admin') && (
          <button onClick={() => { setActiveTab('all'); setEditingLog(null); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'all' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>
            All Logs (Admin)
          </button>
        )}
      </div>

      {activeTab === 'new' && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
          <h2 className="text-xl font-semibold mb-2">
            {editingLog ? `Editing Log #${editingLog.id}` : "Submit New Pre/Post Trip Inspection"}
          </h2>
          <p className="text-sm text-gray-500 mb-6 italic">Ensure you select &quot;Post-Trip Inspection&quot; when you return at the end of your shift.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Trip Type</span>
              <select name="trip_type" value={tripType} onChange={(e) => setTripType(e.target.value)} className="border p-3 rounded bg-white" required>
                <option value="Pre-Trip">Pre-Trip Inspection</option>
                <option value="Post-Trip">Post-Trip Inspection</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Select Route</span>
              <select name="route_id" defaultValue={editingLog?.route_id || ""} className="border p-3 rounded-lg bg-white" required>
                <option value="" disabled>-- Choose a Route --</option>
                {routeOptions.length > 0 ? (
                  routeOptions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                ) : (
                  <option disabled>Loading routes...</option>
                )}
              </select>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Odometer</span>
              <input name="odometer" type="number" defaultValue={editingLog?.odometer} className="border p-3 rounded" required />
            </label>

            <hr className="border-gray-200" />
            
            <div>
               <h3 className="text-lg font-bold text-gray-800 mb-4">Inspection Checklist</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {currentQuestions.map((question, index) => {
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

            {tripType === 'Pre-Trip' && (
              <>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Tire Pressure (PSI) (Required)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600">Driver Front</span><input type="number" placeholder="PSI" value={tirePressures.df} onChange={(e) => handleTireChange('df', e.target.value)} className="border p-3 rounded" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600">Passenger Front</span><input type="number" placeholder="PSI" value={tirePressures.pf} onChange={(e) => handleTireChange('pf', e.target.value)} className="border p-3 rounded" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600">Driver Rear</span><input type="number" placeholder="PSI" value={tirePressures.dr} onChange={(e) => handleTireChange('dr', e.target.value)} className="border p-3 rounded" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600">Passenger Rear</span><input type="number" placeholder="PSI" value={tirePressures.pr} onChange={(e) => handleTireChange('pr', e.target.value)} className="border p-3 rounded" required /></label>
                  </div>
                </div>
                <hr className="border-gray-200" />
              </>
            )}

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Photos (Required)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Front Seats</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500" required={!editingLog?.images?.front} />
                  {editingLog?.images?.front && <a href={editingLog.images.front} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Back Seats</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500" required={!editingLog?.images?.back} />
                  {editingLog?.images?.back && <a href={editingLog.images.back} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <span className="block text-sm font-semibold text-gray-700 mb-2">Trunk</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('trunk', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500" required={!editingLog?.images?.trunk} />
                  {editingLog?.images?.trunk && <a href={editingLog.images.trunk} target="_blank" className="text-xs text-blue-600 mt-2 block underline">View Current Image</a>}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700">Additional Notes / Defects</span>
              <textarea name="notes" defaultValue={editingLog?.notes} className="border p-3 rounded" rows={3} placeholder="General notes..." />
            </label>
            
            <button type="submit" disabled={submitting} className={`font-bold py-3 px-6 rounded text-white flex items-center gap-2 transition-all ${submitting ? "bg-gray-400 cursor-wait" : (editingLog ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700')}`}>
              {submitting ? ( <>Uploading Images...</> ) : ( editingLog ? "Update Log" : "Submit Log" )}
            </button>
          </form>
        </div>
      )}

      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* MOBILE CARD VIEW */}
          <div className="block md:hidden">
            {visibleLogs.map((log) => {
              const hasPermission = canEditOrDelete(log);
              return (
                <div key={log.id} className="p-4 border-b border-gray-100 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{log.trip_type}</span>
                      <p className="text-xs text-gray-500 mt-1">{new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => printLog(log)} className="text-lg bg-gray-50 p-2 rounded">📄</button>
                      <button onClick={() => downloadCSV(log)} className="text-lg bg-gray-50 p-2 rounded">📊</button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-800 font-medium">
                    {activeTab === 'all' && <div className="text-purple-700 mb-1">{log.driver_name}</div>}
                    <div>Route: {log.route_id || "N/A"}</div>
                    <div>Odo: {log.odometer}</div>
                  </div>

                  {log.notes && <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1 italic">&quot;{log.notes}&quot;</div>}

                  {hasPermission && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleEditClick(log)} className="flex-1 text-center bg-orange-50 text-orange-700 text-sm py-2 rounded font-semibold">Edit</button>
                      <button onClick={() => handleDelete(log.id)} className="flex-1 text-center bg-red-50 text-red-700 text-sm py-2 rounded font-semibold">Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
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
