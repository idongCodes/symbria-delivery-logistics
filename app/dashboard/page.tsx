"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { createClient } from "@/lib/supabase/client";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // 👈 Added Import

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
  phone: string;
  jobTitle: string;
};

// Shape for Dynamic Routes
type RouteOption = {
  id: number;
  name: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all' | 'my-info'>('new');
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [loading, setLoading] = useState(true); 
  const [submitting, setSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);

  // Form State for Trip Logs
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

  // State: Password Update Form
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 👇 State: Password Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const dateObj = new Date(log.created_at);
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    
    let firstName = "Unknown";
    let lastName = "Driver";
    
    if (log.driver_name) {
      const parts = log.driver_name.split(" ");
      if (parts.length > 0) firstName = parts[0];
      if (parts.length > 1) lastName = parts.slice(1).join(" ");
    }

    const cleanType = log.trip_type.replace(/\s+/g, '-');
    const filename = `${lastName}-${firstName}-${mm}-${dd}-${cleanType}`;

    const relevantQuestions = log.trip_type === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;

    const checklistRows = relevantQuestions.map((q, index) => {
      const val = log.checklist?.[q] || "-";
      const comment = log.checklist?.[`${q}_COMMENT`];
      
      let isBad = false;
      if (DAMAGE_QUESTIONS.includes(q)) isBad = (val === "Yes");
      else isBad = (val === "No");

      const statusBadge = isBad 
        ? `<span class="badge badge-error">ISSUE</span>` 
        : `<span class="badge badge-success">OK</span>`;

      const rowClass = index % 2 === 0 ? 'bg-gray' : '';

      return `
        <tr class="${rowClass}">
          <td class="q-col">${q}</td>
          <td class="s-col">${statusBadge}</td>
          <td class="n-col">${comment ? `<span class="comment">⚠️ ${comment}</span>` : '<span class="text-muted">-</span>'}</td>
        </tr>
      `;
    }).join('');
    
    let tireHtml = "";
    if (log.trip_type === 'Pre-Trip') {
      const tDF = log.checklist?.["Tire Pressure (Driver Front)"] || "-";
      const tPF = log.checklist?.["Tire Pressure (Passenger Front)"] || "-";
      const tDR = log.checklist?.["Tire Pressure (Driver Rear)"] || "-";
      const tPR = log.checklist?.["Tire Pressure (Passenger Rear)"] || "-";
      tireHtml = `
        <div class="section-box page-break-inside-avoid">
            <h3>Tire Pressure (PSI)</h3>
            <table class="tire-table">
                <tr><th>Driver Front</th><th>Passenger Front</th><th>Driver Rear</th><th>Passenger Rear</th></tr>
                <tr><td>${tDF}</td><td>${tPF}</td><td>${tDR}</td><td>${tPR}</td></tr>
            </table>
        </div>
      `;
    }

    const imgFront = log.images?.front ? `<div class="img-box"><p>Front Seat</p><img src="${log.images.front}" /></div>` : '';
    const imgBack = log.images?.back ? `<div class="img-box"><p>Back Seat</p><img src="${log.images.back}" /></div>` : '';
    const imgTrunk = log.images?.trunk ? `<div class="img-box"><p>Trunk</p><img src="${log.images.trunk}" /></div>` : '';
    
    let imagesHtml = "";
    if (imgFront || imgBack || imgTrunk) {
        imagesHtml = `
            <div class="page-break-inside-avoid" style="margin-top: 20px;">
                <h3>Vehicle Photos</h3>
                <div class="images-container">
                    ${imgFront}
                    ${imgBack}
                    ${imgTrunk}
                </div>
            </div>
        `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            @media print {
                @page { margin: 0.5cm; size: portrait; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.4; max-width: 900px; margin: 0 auto; padding: 20px; }
            h1 { font-size: 22px; margin: 0 0 15px 0; color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
            h3 { font-size: 14px; margin: 20px 0 10px 0; color: #444; text-transform: uppercase; background: #e2e8f0; padding: 8px; border-radius: 4px; font-weight: 700; }
            .header-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-item { background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1; }
            .info-label { display: block; font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; margin-bottom: 2px;}
            .info-value { font-size: 14px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #e2e8f0; }
            th { text-align: left; background: #f1f5f9; padding: 8px; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; color: #475569; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            .bg-gray { background-color: #f8fafc; }
            .q-col { width: 50%; font-weight: 600; font-size: 11px; }
            .s-col { width: 10%; text-align: center; }
            .n-col { width: 40%; font-size: 11px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .badge-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .badge-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
            .comment { color: #b91c1c; font-weight: 600; display: block; background: #fff5f5; padding: 4px; border-radius: 4px; border-left: 3px solid #ef4444; }
            .text-muted { color: #cbd5e1; font-style: italic; }
            .notes-box { background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 4px; margin-top: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .tire-table th, .tire-table td { text-align: center; border: 1px solid #e2e8f0; font-size: 13px; padding: 10px; }
            .tire-table th { background: #f8fafc; }
            .images-container { display: flex; gap: 15px; margin-top: 10px; }
            .img-box { flex: 1; border: 1px solid #cbd5e1; padding: 5px; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .img-box p { margin: 0 0 5px 0; font-weight: bold; font-size: 10px; text-align: center; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .img-box img { width: 100%; height: 180px; object-fit: cover; border-radius: 4px; }
            .page-break-inside-avoid { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>
            <span>Symbria RX Logistics</span>
            <span style="font-size:14px; color:#64748b; font-weight:normal;">Trip Log #${log.id}</span>
          </h1>
          
          <div class="header-grid">
            <div class="info-item">
                <span class="info-label">Driver</span>
                <div class="info-value">${log.driver_name || 'Unknown'}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Inspection Type</span>
                <div class="info-value" style="color:${log.trip_type === 'Pre-Trip' ? '#2563eb' : '#d97706'}">${log.trip_type}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Date & Time</span>
                <div class="info-value">${new Date(log.created_at).toLocaleString()}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Route / Odometer</span>
                <div class="info-value">${log.route_id || 'N/A'} / ${log.odometer}</div>
            </div>
          </div>

          ${tireHtml}

          <h3>Inspection Checklist</h3>
          <table>
            <thead>
                <tr>
                    <th>Inspection Item</th>
                    <th style="text-align:center;">Status</th>
                    <th>Notes / Defects</th>
                </tr>
            </thead>
            <tbody>
                ${checklistRows}
            </tbody>
          </table>

          ${log.notes ? `
            <div class="notes-box page-break-inside-avoid">
                <span class="info-label" style="color:#92400e; margin-bottom:5px;">Additional Notes</span>
                <div style="font-size:13px; color:#78350f; font-weight:500;">${log.notes}</div>
            </div>
          ` : ''}

          ${imagesHtml}

          <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 10px;">
            <p>Certified by ${log.driver_name} on ${new Date(log.created_at).toLocaleDateString()}</p>
            Symbria RX Logistics Digital Dashboard
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.new !== passwordForm.confirm) {
        setPasswordMsg({ type: "error", text: "New passwords do not match." });
        setPasswordLoading(false);
        return;
    }
    if (passwordForm.new.length < 6) {
        setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
        setPasswordLoading(false);
        return;
    }

    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userProfile?.email || "",
            password: passwordForm.current,
        });

        if (signInError) {
            throw new Error("Current password is incorrect.");
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: passwordForm.new,
        });

        if (updateError) throw updateError;

        setPasswordMsg({ type: "success", text: "Password updated successfully!" });
        setPasswordForm({ current: "", new: "", confirm: "" });

    } catch (err: any) {
        setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
        setPasswordLoading(false);
    }
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
        phone: metadata.phone || "N/A",
        jobTitle: metadata.job_title || "N/A"
      });

      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (routeError) console.error("Route Error:", routeError);
      if (routeData) setRouteOptions(routeData);

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
      const imageUrls = { ...(editingLog?.images || { front: "", back: "", trunk: "" }) };
      if (imageFiles.front) imageUrls.front = await uploadImage(imageFiles.front);
      if (imageFiles.back) imageUrls.back = await uploadImage(imageFiles.back);
      if (imageFiles.trunk) imageUrls.trunk = await uploadImage(imageFiles.trunk);

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

      const baseData = {
        user_id: userProfile.id,
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

        if (!error) {
            fetch('/api/email-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...baseData,
                    created_at: new Date().toISOString()
                })
            }).catch(err => console.error("Email trigger failed:", err));
        }
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

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, {userProfile?.firstName}</p>
        </div>
        {userProfile && (
          <h3 className="text-gray-400 dark:text-gray-500 font-medium text-left md:text-right">
            {userProfile.firstName} {userProfile.lastName} <br />
            <span className={`uppercase text-xs tracking-wider border px-2 py-0.5 rounded-full mt-1 inline-block ${
              userProfile.role === 'Admin' ? 'border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 
              userProfile.role === 'Management' ? 'border-purple-300 dark:border-purple-900 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 
              'border-gray-300 dark:border-gray-600'
            }`}>
              {userProfile.role}
            </span>
          </h3>
        )}
      </header>

      <div className="flex border-b border-gray-300 dark:border-gray-700 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <button onClick={() => { setActiveTab('new');
          setEditingLog(null); setChecklistData({}); setChecklistComments({}); setImageFiles({front:null, back:null, trunk:null}); setTirePressures({df:"", pf:"", dr:"", pr:""}); setTripType("Pre-Trip");
        }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'new' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {editingLog ? `Editing #${editingLog.id}` : 'New Form'}
        </button>
        <button onClick={() => { setActiveTab('history');
          setEditingLog(null); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          My Logs
        </button>
        {(userProfile?.role === 'Management' || userProfile?.role === 'Admin') && (
          <button onClick={() => { setActiveTab('all'); setEditingLog(null); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'all' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
            All Logs (Admin)
          </button>
        )}
        
        <button 
          onClick={() => { setActiveTab('my-info'); setEditingLog(null); }} 
          className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'my-info' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          My Info
        </button>
      </div>
      
      {activeTab === 'my-info' && userProfile && (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
              {userProfile.firstName[0]}{userProfile.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userProfile.firstName} {userProfile.lastName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{userProfile.jobTitle}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">First Name</label>
                 <div className="font-medium text-gray-900 dark:text-white">{userProfile.firstName}</div>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Last Name</label>
                 <div className="font-medium text-gray-900 dark:text-white">{userProfile.lastName}</div>
               </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Company Position</label>
               <div className="font-medium text-gray-900 dark:text-white">{userProfile.jobTitle}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Phone Number</label>
                 <div className="font-medium text-gray-900 dark:text-white">{userProfile.phone}</div>
               </div>
               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">Email</label>
                 <div className="font-medium text-gray-900 dark:text-white">{userProfile.email}</div>
               </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Change Password Section */}
          <div className="pt-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Change Password</h3>
            
            {passwordMsg.text && (
              <div className={`p-3 rounded text-sm mb-4 ${
                passwordMsg.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black dark:text-white pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black dark:text-white pr-10"
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black dark:text-white pr-10"
                      placeholder="Re-enter new password"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {activeTab === 'new' && (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-4xl">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {editingLog ? `Editing Log #${editingLog.id}` : "Submit New Pre/Post Trip Inspection"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 italic">Ensure you select &quot;Post-Trip Inspection&quot; when you return at the end of your shift.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trip Type</span>
              <select name="trip_type" value={tripType} onChange={(e) => setTripType(e.target.value)} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required>
                <option value="Pre-Trip">Pre-Trip Inspection</option>
                <option value="Post-Trip">Post-Trip Inspection</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Route</span>
              <select name="route_id" defaultValue={editingLog?.route_id || ""} className="border p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required>
                <option value="" disabled>-- Choose a Route --</option>
                {routeOptions.length > 0 ? (
                  routeOptions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                ) : (
                  <option disabled>Loading routes...</option>
                )}
              </select>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Odometer</span>
              <input name="odometer" type="number" defaultValue={editingLog?.odometer} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required />
            </label>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            <div>
               <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Inspection Checklist</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {currentQuestions.map((question, index) => {
                   const answer = checklistData[question];
                   const showComment = requiresDescription(question, answer);
                   const isBad = showComment;
                   return (
                     <div key={index} className={`flex flex-col bg-gray-50 dark:bg-gray-700/50 p-3 rounded border ${isBad ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-sm text-gray-700 dark:text-gray-200 font-medium max-w-[70%]">{question}</span>
                         <div className="flex gap-4">
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="Yes" checked={answer === "Yes"} onChange={() => handleChecklistChange(question, "Yes")} className="accent-green-600 w-4 h-4" required />
                             <span className="text-sm dark:text-gray-300">Yes</span>
                           </label>
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="No" checked={answer === "No"} onChange={() => handleChecklistChange(question, "No")} className="accent-red-600 w-4 h-4" />
                             <span className="text-sm dark:text-gray-300">No</span>
                           </label>
                         </div>
                       </div>
                       {showComment && (
                         <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                           <input type="text" placeholder="Describe issue (Required)" value={checklistComments[question] || ""} onChange={(e) => handleCommentChange(question, e.target.value)} className="w-full text-sm border border-red-300 rounded p-2 focus:outline-none focus:border-red-500 text-red-700 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 bg-white dark:bg-gray-800" required />
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {tripType === 'Pre-Trip' && (
              <>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Tire Pressure (PSI) (Required)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Driver Front</span><input type="number" placeholder="PSI" value={tirePressures.df} onChange={(e) => handleTireChange('df', e.target.value)} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Passenger Front</span><input type="number" placeholder="PSI" value={tirePressures.pf} onChange={(e) => handleTireChange('pf', e.target.value)} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Driver Rear</span><input type="number" placeholder="PSI" value={tirePressures.dr} onChange={(e) => handleTireChange('dr', e.target.value)} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required /></label>
                    <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Passenger Rear</span><input type="number" placeholder="PSI" value={tirePressures.pr} onChange={(e) => handleTireChange('pr', e.target.value)} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" required /></label>
                  </div>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
              </>
            )}

            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Vehicle Photos (Required)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Front Seats</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200" required={!editingLog?.images?.front} />
                  {editingLog?.images?.front && <a href={editingLog.images.front} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Back Seats</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200" required={!editingLog?.images?.back} />
                  {editingLog?.images?.back && <a href={editingLog.images.back} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded border border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Trunk</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange('trunk', e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200" required={!editingLog?.images?.trunk} />
                  {editingLog?.images?.trunk && <a href={editingLog.images.trunk} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 mt-2 block underline">View Current Image</a>}
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Notes / Defects</span>
              <textarea name="notes" defaultValue={editingLog?.notes} className="border p-3 rounded bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600" rows={3} placeholder="General notes..." />
            </label>
            
            <button type="submit" disabled={submitting} className={`font-bold py-3 px-6 rounded text-white flex items-center gap-2 transition-all ${submitting ? "bg-gray-400 cursor-wait" : (editingLog ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700')}`}>
              {submitting ? ( <>Uploading Images...</> ) : ( editingLog ? "Update Log" : "Submit Log" )}
            </button>
          </form>
        </div>
      )}

      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          {/* MOBILE CARD VIEW */}
          <div className="block md:hidden">
            {visibleLogs.map((log) => {
              const hasPermission = canEditOrDelete(log);
              return (
                <div key={log.id} className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>{log.trip_type}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="flex gap-2">
                      {/* VIEW BUTTON ADDED HERE */}
                      <Link 
                        href={`/logs/${log.id}`}
                        className="text-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center"
                        title="View Log"
                      >
                        👁️
                      </Link>

                      <button onClick={() => printLog(log)} className="text-lg bg-gray-50 dark:bg-gray-700 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">📄</button>
                      <button onClick={() => downloadCSV(log)} className="text-lg bg-gray-50 dark:bg-gray-700 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">📊</button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {activeTab === 'all' && <div className="text-purple-700 dark:text-purple-400 mb-1">{log.driver_name}</div>}
                    <div>Route: {log.route_id || "N/A"}</div>
                    <div>Odo: {log.odometer}</div>
                  </div>

                  {log.notes && <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded mt-1 italic">&quot;{log.notes}&quot;</div>}

                  {hasPermission && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button onClick={() => handleEditClick(log)} className="flex-1 text-center bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-sm py-2 rounded font-semibold">Edit</button>
                      <button onClick={() => handleDelete(log.id)} className="flex-1 text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm py-2 rounded font-semibold">Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  {activeTab === 'all' && <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Driver</th>}
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Route</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Odo</th>
                  <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {visibleLogs.map((log) => {
                  const hasPermission = canEditOrDelete(log);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4 flex gap-2">
                        {/* VIEW BUTTON ADDED HERE */}
                        <Link 
                          href={`/logs/${log.id}`}
                          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-2 py-1 rounded flex items-center justify-center"
                          title="View Log"
                        >
                          👁️
                        </Link>

                        <button onClick={() => printLog(log)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded">📄</button>
                        <button onClick={() => downloadCSV(log)} className="text-xs bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 px-2 py-1 rounded">📊</button>
                        {hasPermission && (
                          <>
                            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>
                            <button onClick={() => handleEditClick(log)} className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">✏️</button>
                            <button onClick={() => handleDelete(log.id)} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded">🗑️</button>
                          </>
                        )}
                      </td>
                      {activeTab === 'all' && <td className="p-4 font-medium text-gray-900 dark:text-white">{log.driver_name}</td>}
                      <td className="p-4 text-gray-600 dark:text-gray-400">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{log.route_id || "-"}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>{log.trip_type}</span></td>
                      <td className="p-4 text-gray-900 dark:text-gray-200">{log.odometer}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 truncate max-w-xs">{log.notes || "-"}</td>
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