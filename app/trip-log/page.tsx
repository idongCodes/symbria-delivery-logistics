"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { createClient } from "@/lib/supabase/client";
import { generateShareToken } from "@/app/actions/log-actions";
import imageCompression from "browser-image-compression";
import { EyeIcon, PencilSquareIcon, TrashIcon, DocumentArrowDownIcon, PrinterIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import ClientDate from "@/app/components/ClientDate";
import ImageUploadInput from "@/app/components/ImageUploadInput";

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
  "Any new damage to vehicle?"
];

const SCANNER_QUESTIONS = [
  "Scanner Synchronized",
  "Clicked End Route",
  "Completely Logged off Scanner",
  "Scanner returned & plugged in"
];

const KEY_QUESTIONS = [
  "Vehicle key returned to lockbox"
];

const ALL_QUESTIONS_MASTER = Array.from(new Set([...PRE_TRIP_QUESTIONS, ...POST_TRIP_QUESTIONS, ...SCANNER_QUESTIONS, ...KEY_QUESTIONS]));

const DAMAGE_QUESTIONS = [
  "Dings, dents, or other visible damage on interior/exterior",
  "Cracks/chips on any windows",
  "Dashboard warning lights on",
  "Any new damage to vehicle?"
];

const ROUTE_STOPS: Record<string, string[]> = {
  "North East (NE)": [
    "Beaumont at Northborough", "Beaumont at Westborough", "Whitney Place at Natick", 
    "Lasell Village", "Campion", "Newbury Court", "Edgewood at the Meadows", 
    "Sherrill House", "South Cove", "Dwyer Home"
  ],
  "South West (SW)": [
    "The Overlook", "Livewell", "Health Center at the Willows", 
    "Holy Trinity", "Dodge Park", "Oasis at Dodge Park", "Knollwood"
  ],
  "South East (SE)": [
    "Madonna Manor", "Marian Manor", "Catholic Memorial", 
    "Summit ElderCare", "Sacred Heart", "Our Lady's Haven"
  ]
};

// Define Trip Log Shape
type TripLog = {
  id: number;
  created_at: string;
  updated_at: string; 
  edit_count: number; 
  user_id: string;
  route_id: string;
  odometer: number;
  trip_type: string;
  notes: string;
  checklist: Record<string, unknown>; 
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

type ModalConfig = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'confirm' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
};

type TackleBoxDelivery = {
  location: string;
  deliveredCount: string;
  nurseEmptied: 'Yes' | 'No' | null;
  emptiedReturnedCount: string;
  returnedToPharmacy: boolean;
  unemptiedReturnedCount: string;
  medsNeedRefrigeration: 'Yes' | 'No' | null;
  medsMovedToFridge: boolean;
};

type MedReturn = {
  hadReturns: 'Yes' | 'No' | null;
  reason?: string;
  facilityPatient: string;
  handedToPharmacy: 'Yes' | 'No' | null;
  needsRefrigeration: 'Yes' | 'No' | null;
  placedInFridge: 'Yes' | 'No' | null;
};

import { saveImageToDB, loadImagesFromDB, clearImagesFromDB } from "@/app/lib/indexedDB";

export default function Dashboard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const [loading, setLoading] = useState(true); 
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [editingLog, setEditingLog] = useState<TripLog | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all' | 'my-info' | 'med-carts'>('new');

  // Modal State
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: 'info'
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
  const showModal = (config: Omit<ModalConfig, 'isOpen'>) => setModalConfig({ ...config, isOpen: true });

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(5);

  // Filtering State
  const [filterDriver, setFilterDriver] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterIssuesOnly, setFilterIssuesOnly] = useState(false);

  // Form State for Trip Logs
  const [tripType, setTripType] = useState<string>("Pre-Trip");
  const [checklistData, setChecklistData] = useState<Record<string, string>>({});
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({});
  const [tirePressures, setTirePressures] = useState({
    df: "", pf: "", dr: "", pr: ""
  });
  const [routeId, setRouteId] = useState("");
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");

  // Tackle Box State
  const [tackleBoxesIncluded, setTackleBoxesIncluded] = useState<'Yes' | 'No' | null>(null);
  const [tackleBoxDeliveries, setTackleBoxDeliveries] = useState<TackleBoxDelivery[]>([]);

  // Med Returns State
  const [medReturnData, setMedReturnData] = useState<MedReturn>({
    hadReturns: null,
    reason: "",
    facilityPatient: "",
    handedToPharmacy: null,
    needsRefrigeration: null,
    placedInFridge: null
  });

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setTripType("Pre-Trip");
    setChecklistData({});
    setChecklistComments({});
    setTirePressures({ df: "", pf: "", dr: "", pr: "" });
    setRouteId("");
    setOdometer("");
    setNotes("");
    setTackleBoxesIncluded(null);
    setTackleBoxDeliveries([]);
    setMedReturnData({ hadReturns: null, reason: "", facilityPatient: "", handedToPharmacy: null, needsRefrigeration: null, placedInFridge: null });
    setImageFiles({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null, fuelGauge: null });
    localStorage.removeItem("tripLogFormState");
    clearImagesFromDB();
  }, []);

  useEffect(() => {
    if (editingLog) return;
    const stateToSave = { firstName, lastName, tripType, checklistData, checklistComments, tirePressures, routeId, odometer, notes, tackleBoxesIncluded, tackleBoxDeliveries, medReturnData };
    const isEmpty = Object.keys(checklistData).length === 0 && Object.keys(checklistComments).length === 0 && !routeId && !odometer && !notes && tripType === "Pre-Trip" && !tackleBoxesIncluded && tackleBoxDeliveries.length === 0 && !firstName && !lastName;
    if (!isEmpty) {
      localStorage.setItem("tripLogFormState", JSON.stringify(stateToSave));
    }
  }, [firstName, lastName, tripType, checklistData, checklistComments, tirePressures, routeId, odometer, notes, tackleBoxesIncluded, tackleBoxDeliveries, medReturnData, editingLog]);

  useEffect(() => {
    if (editingLog) return;
    const savedState = localStorage.getItem("tripLogFormState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
        setTripType(parsed.tripType || "Pre-Trip");
        setChecklistData(parsed.checklistData || {});
        setChecklistComments(parsed.checklistComments || {});
        setTirePressures(parsed.tirePressures || { df: "", pf: "", dr: "", pr: "" });
        setRouteId(parsed.routeId || "");
        setOdometer(parsed.odometer || "");
        setNotes(parsed.notes || "");
        setTackleBoxesIncluded(parsed.tackleBoxesIncluded || null);
        setTackleBoxDeliveries(parsed.tackleBoxDeliveries || []);
        if (parsed.medReturnData) {
          setMedReturnData(parsed.medReturnData);
        }
      } catch (e) {
        console.error("Failed to parse saved form state", e);
      }
    }
    
    // Load images from IndexedDB
    loadImagesFromDB().then(savedImages => {
      setImageFiles(prev => ({ ...prev, ...savedImages }));
    });
  }, [editingLog]);
  
  const [imageFiles, setImageFiles] = useState<{
    front: File | null;
    back: File | null;
    trunk: File | null;
    driverSide: File | null;
    passengerSide: File | null;
    rear: File | null;
    driverFrontTire: File | null;
    passengerFrontTire: File | null;
    driverRearTire: File | null;
    passengerRearTire: File | null;
    frontSeat: File | null;
    fuelGauge: File | null;
  }>({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null, fuelGauge: null });

  const [compressing, setCompressing] = useState<Record<string, boolean>>({});



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
      'Notes', 'Img Front', 'Img Back', 'Img Trunk', 'Img Login Screen', 'Img Fuel Gauge', 'Edits', 
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
      log.images?.deliveryTrackLoginScreen || "N/A",
      log.images?.fuelGauge || "N/A",
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

  const handlePrint = (log: TripLog) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return showModal({
      title: "Popup Blocked",
      message: "Please allow popups to download/print this log.",
      type: 'info'
    });

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
    
    let checklistObj: Record<string, string> = {};
    try {
      if (typeof log.checklist === 'string') {
        checklistObj = JSON.parse(log.checklist);
      } else if (log.checklist && typeof log.checklist === 'object') {
        checklistObj = log.checklist as Record<string, string>;
      }
    } catch (e) {
      console.error("Error parsing checklist in generatePDF:", e);
    }

    let tireHtml = "";
    const tDF = checklistObj["Tire Pressure (Driver Front)"] || "-";
    const tPF = checklistObj["Tire Pressure (Passenger Front)"] || "-";
    const tDR = checklistObj["Tire Pressure (Driver Rear)"] || "-";
    const tPR = checklistObj["Tire Pressure (Passenger Rear)"] || "-";
    tireHtml = `
      <div class="section-box page-break-inside-avoid">
          <h3>Tire Pressure (PSI)</h3>
          <table class="tire-table">
              <tr><th>Driver Front</th><th>Passenger Front</th><th>Driver Rear</th><th>Passenger Rear</th></tr>
              <tr><td>${tDF}</td><td>${tPF}</td><td>${tDR}</td><td>${tPR}</td></tr>
          </table>
      </div>
    `;

    // --- 1. Format Scanner for Print ---
    let scannerRows = "";
    SCANNER_QUESTIONS.forEach(q => {
        const val = checklistObj[q] || "-";
        const comment = checklistObj[`${q}_COMMENT`];
        const isBad = val === "No";
        scannerRows += `
          <tr>
            <td class="q-col">${q}</td>
            <td class="s-col"><span class="badge ${isBad ? 'badge-error' : 'badge-success'}">${isBad ? 'ISSUE' : 'OK'}</span></td>
            <td class="n-col">${comment ? `<span class="comment">⚠️ ${comment}</span>` : '-'}</td>
          </tr>
        `;
    });

    const scannerHtml = `
      <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
          <h3>Scanner</h3>
          <table>
            <thead><tr><th>Protocol Item</th><th style="text-align:center;">Status</th><th>Notes</th></tr></thead>
            <tbody>${scannerRows}</tbody>
          </table>
      </div>
    `;

    // --- Format Key for Print ---
    let keyRows = "";
    KEY_QUESTIONS.forEach(q => {
        const val = checklistObj[q] || "-";
        const comment = checklistObj[`${q}_COMMENT`];
        const statusBadge = val === "No" ? `<span class="badge badge-error">ISSUE</span>` : `<span class="badge badge-success">OK</span>`;
        keyRows += `
          <tr>
            <td class="q-col">${q}</td>
            <td class="s-col">${statusBadge}</td>
            <td class="n-col">${comment ? `<span class="comment">⚠️ ${comment}</span>` : '<span class="text-muted">-</span>'}</td>
          </tr>
        `;
    });

    const keyHtml = `
      <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
          <h3>Keys</h3>
          <table>
            <thead><tr><th>Protocol Item</th><th style="text-align:center;">Status</th><th>Notes</th></tr></thead>
            <tbody>${keyRows}</tbody>
          </table>
      </div>
    `;

    // --- Format Med Returns for Print ---
    let medReturnsHtml = "";
    const medReturns = checklistObj["Med Returns"] as unknown as MedReturn;
    if (medReturns) {
      let details = "";
      if (medReturns.hadReturns === 'Yes') {
        details = `
          <div style="padding:10px; font-size:12px;">
            <p><strong>Had Returns:</strong> Yes</p>
            <p><strong>Reason:</strong> ${medReturns.reason || 'N/A'}</p>
            <p><strong>Facility/Patient:</strong> ${medReturns.facilityPatient}</p>
            <p><strong>Handed to Pharmacy/Dropbox:</strong> ${medReturns.handedToPharmacy || 'N/A'}</p>
            <p><strong>Require Refrigeration:</strong> ${medReturns.needsRefrigeration || 'N/A'}</p>
            ${medReturns.needsRefrigeration === 'Yes' ? `<p><strong>Placed in Refrigerator:</strong> ${medReturns.placedInFridge || 'N/A'}</p>` : ''}
          </div>
        `;
      } else {
        details = `<div style="padding:10px; font-size:12px;"><strong>Had Returns:</strong> No</div>`;
      }
      medReturnsHtml = `
        <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
          <h3>💊 Med Returns</h3>
          ${details}
        </div>
      `;
    }

    // --- 2. Format Tackle Box for Print ---
    let tackleBoxHtml = "";
    if (checklistObj["Tackle Boxes Included"]) {
      if (checklistObj["Tackle Boxes Included"] === "Yes" && Array.isArray(checklistObj["Tackle Box Deliveries"])) {
        const deliveries = checklistObj["Tackle Box Deliveries"] as Array<Record<string, unknown>>;
        const deliveryRows = deliveries.map(d => {
          let details = `Qty: ${d.deliveredCount || 0} | Nurse Emptied: ${d.nurseEmptied}`;
          if (d.nurseEmptied === "Yes") {
            details += ` (${d.emptiedReturnedCount || 0} returned)`;
          } else {
            details += ` | Returned Pharmacy: ${d.returnedToPharmacy ? 'YES' : 'NO'} (${d.unemptiedReturnedCount || 0}) | Refrigerated: ${d.medsNeedRefrigeration === "Yes" ? (d.medsMovedToFridge ? 'Moved to Fridge' : 'NOT MOVED') : 'No'}`;
          }
          return `<tr><td style="font-weight:bold;">${d.location}</td><td style="font-size:11px;">${details}</td></tr>`;
        }).join("");

        tackleBoxHtml = `
          <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
              <h3>📦 Tackle Box Deliveries</h3>
              <table style="font-size:12px;">
                  ${deliveryRows}
              </table>
          </div>
        `;
      } else {
        tackleBoxHtml = `
          <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
              <h3>📦 Tackle Box Deliveries</h3>
              <div style="font-size:13px; font-weight:bold; margin-top:10px;">
                Tackle Boxes Included: ${checklistObj["Tackle Boxes Included"]}
              </div>
          </div>
        `;
      }
    }

    const imageTitles: { [key: string]: string } = {
      front: "Front of Vehicle",
      driverSide: "Driver Side",
      rear: "Rear of Vehicle",
      passengerSide: "Passenger Side",
      driverFrontTire: "Driver Front Tire",
      passengerFrontTire: "Passenger Front Tire",
      driverRearTire: "Driver Rear Tire",
      passengerRearTire: "Passenger Rear Tire",
      frontSeat: "Front Seat Area",
      back: "Back Seat",
      trunk: "Trunk",

      fuelGauge: "Fuel Gauge",
      vestibuleTrashPhoto: "Vestibule Trash Collection",
    };

    let exteriorImagesHtml = "";
    let tireImagesHtml = "";
    let interiorImagesHtml = "";
    let vestibuleTrashHtml = "";

    if (log.images) {
      const exteriorKeys = ["front", "driverSide", "rear", "passengerSide"];
      const tireKeys = ["driverFrontTire", "passengerFrontTire", "driverRearTire", "passengerRearTire"];
      const interiorKeys = ["frontSeat", "back", "trunk", "fuelGauge"];

      if (log.images.vestibuleTrashPhoto) {
        vestibuleTrashHtml = `
          <div class="section-box page-break-inside-avoid" style="margin-top:20px;">
              <h3>Vestibule Cleanliness</h3>
              <div style="padding:10px;">
                <p style="margin-bottom:10px; font-weight:bold;">All trash collected from vestibule?</p>
                <img src="${log.images.vestibuleTrashPhoto}" style="width:100%; max-width:400px; border-radius:4px; border:1px solid #ddd;" />
              </div>
          </div>
        `;
      }

      const generateImageHtml = (keys: string[], title: string) => {
        let html = '';
        let sectionImagesHtml = '';
        let count = 0;
        for (const key of keys) {
          if (log.images && log.images[key]) {
            sectionImagesHtml += `
              <div class="img-box">
                <p>${imageTitles[key] || key}</p>
                <img src="${log.images[key]}" />
              </div>
            `;
            count++;
          }
        }
        if (count > 0) {
          html = `
            <div class="page-break-inside-avoid" style="margin-top: 20px;">
                <h3>${title}</h3>
                <div class="images-container">
                    ${sectionImagesHtml}
                </div>
            </div>
          `;
        }
        return html;
      }

      exteriorImagesHtml = generateImageHtml(exteriorKeys, "Exterior Photos");
      tireImagesHtml = generateImageHtml(tireKeys, "Tire Photos");
      interiorImagesHtml = generateImageHtml(interiorKeys, "Interior Photos");
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

          ${scannerHtml}
          ${keyHtml}
          ${medReturnsHtml}
          ${tackleBoxHtml}
          ${tireHtml}
          ${vestibuleTrashHtml}

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

          ${exteriorImagesHtml}
          ${tireImagesHtml}
          ${interiorImagesHtml}

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

  const handleDelete = async (logId: number) => {
    showModal({
      title: "Confirm Deletion",
      message: "Are you sure? This cannot be undone.",
      type: 'confirm',
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        const { error } = await supabase.from('trip_logs').delete().eq('id', logId);
        if (error) {
          showModal({
            title: "Error",
            message: "Error: " + error.message,
            type: 'error'
          });
        } else {
          showModal({
            title: "Success",
            message: "Log deleted successfully.",
            type: 'success'
          });
          fetchData();
        }
      }
    });
  };

  const handleEditClick = (log: TripLog) => {
    setEditingLog(log);
    setTripType(log.trip_type);
    const nameParts = (log.driver_name || "").split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
    setRouteId(log.route_id || "");
    setOdometer(log.odometer?.toString() || "");
    setNotes(log.notes || "");
    setMedReturnData((log.checklist["Med Returns"] as MedReturn) || { hadReturns: null, reason: "", facilityPatient: "", handedToPharmacy: null, needsRefrigeration: null, placedInFridge: null });
    setImageFiles({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null, fuelGauge: null });

    const answers: Record<string, string> = {};
    const comments: Record<string, string> = {};
    
    if (log.checklist) {
      setTirePressures({
        df: (log.checklist["Tire Pressure (Driver Front)"] as string) || "",
        pf: (log.checklist["Tire Pressure (Passenger Front)"] as string) || "",
        dr: (log.checklist["Tire Pressure (Driver Rear)"] as string) || "",
        pr: (log.checklist["Tire Pressure (Passenger Rear)"] as string) || "",
      });

      setTackleBoxesIncluded((log.checklist["Tackle Boxes Included"] as 'Yes' | 'No' | null) || null);
      setTackleBoxDeliveries((log.checklist["Tackle Box Deliveries"] as TackleBoxDelivery[]) || []);

      Object.keys(log.checklist).forEach(key => {
        if (key.includes("Tire Pressure") || key === "Tackle Boxes Included" || key === "Tackle Box Deliveries") return;
        if (key.endsWith('_COMMENT')) {
          const realKey = key.replace('_COMMENT', '');
          comments[realKey] = log.checklist[key] as string;
        } else {
          answers[key] = log.checklist[key] as string;
        }
      });
    }
    setChecklistData(answers);
    setChecklistComments(comments);
    setActiveTab('new');
  };

  const fetchData = useCallback(async () => {
    try {
      // Always attempt to fetch route data, as it's public
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (routeError) console.error("Route Error:", routeError);
      if (routeData) setRouteOptions(routeData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        setLoading(false); // Ensure loading state is reset even without a session
        return; 
      }
      
      const { user } = session;

      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Set a basic profile if fetch fails
        setUserProfile({
          id: user.id,
          firstName: user.email?.split('@')[0] || 'User',
          lastName: '',
          role: 'Driver',
          email: user.email || '',
          phone: '',
          jobTitle: 'Driver'
        });
      } else if (profileData) {
        setUserProfile({
          id: profileData.id,
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          role: profileData.role || 'Driver',
          email: profileData.email || '',
          phone: profileData.phone || '',
          jobTitle: profileData.job_title || 'Driver'
        });
      }

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
  const handleFileChange = async (key: 'front' | 'frontSeat' | 'back' | 'trunk' | 'driverSide' | 'passengerSide' | 'rear' | 'driverFrontTire' | 'passengerFrontTire' | 'driverRearTire' | 'passengerRearTire' | 'fuelGauge', file: File | null) => {
    if (!file) {
      setImageFiles(prev => ({ ...prev, [key]: null }));
      saveImageToDB(key, null);
      return;
    }

    setCompressing(prev => ({ ...prev, [key]: true }));
    
    try {
      const options = {
        maxSizeMB: 0.2, // Aim for 200KB early
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      // Ensure the name is preserved for the UI
      const renamedFile = new File([compressedFile], file.name, { type: file.type });
      
      setImageFiles(prev => ({ ...prev, [key]: renamedFile }));
      saveImageToDB(key, renamedFile);
    } catch (error) {
      console.error("Early compression failed:", error);
      setImageFiles(prev => ({ ...prev, [key]: file }));
      saveImageToDB(key, file);
    } finally {
      setCompressing(prev => ({ ...prev, [key]: false }));
    }
  };
  const handleTireChange = (key: 'df' | 'pf' | 'dr' | 'pr', value: string) => setTirePressures(prev => ({ ...prev, [key]: value }));
  
  const uploadImage = async (file: File, quality: number = 0.6) => {
    // If the file is already small enough (under 300KB), don't re-compress
    if (file.size < 300 * 1024) {
      return await uploadAndGetUrl(file);
    }

    const options = {
      maxSizeMB: 0.2, // Compressed down to ~200kb for faster uploads on weak networks
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      initialQuality: quality,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return await uploadAndGetUrl(compressedFile);
    } catch (error) {
      console.error("Image compression failed:", error);
      // Fallback to uploading the original file if compression fails
      return await uploadAndGetUrl(file);
    }
  };

  const uploadAndGetUrl = async (file: File) => {
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
  
    const formElement = e.currentTarget;
    setSubmitting(true);
  
    try {
      const finalChecklist: Record<string, unknown> = { ...checklistData };
      Object.keys(checklistComments).forEach(q => {
        const answer = checklistData[q];
        if (requiresDescription(q, answer) && checklistComments[q]) {
          finalChecklist[`${q}_COMMENT`] = checklistComments[q];
        }
      });
  
      finalChecklist["Tire Pressure (Driver Front)"] = tirePressures.df;
      finalChecklist["Tire Pressure (Passenger Front)"] = tirePressures.pf;
      finalChecklist["Tire Pressure (Driver Rear)"] = tirePressures.dr;
      finalChecklist["Tire Pressure (Passenger Rear)"] = tirePressures.pr;

      if (tripType === 'Post-Trip' && tackleBoxesIncluded) {
        finalChecklist["Tackle Boxes Included"] = tackleBoxesIncluded;
        if (tackleBoxesIncluded === 'Yes') {
          finalChecklist["Tackle Box Deliveries"] = tackleBoxDeliveries;
        }
      }

      if (tripType === 'Post-Trip') {
        finalChecklist["Med Returns"] = medReturnData;
      }

      if (finalChecklist["Was there trash in vestibule when you arrived?"] !== "Yes") {
        delete finalChecklist["Was trash removed before you left?"];
      }
  
      const baseData = {
        user_id: userProfile?.id || "e04fde02-765b-40d0-8cdb-3449b2b21eca", // Use Guest Driver ID for public forms
        route_id: routeId,
        odometer: Number(odometer),
        trip_type: tripType,
        notes: notes,
        checklist: finalChecklist,
        images: {}, // Start with empty images
        driver_name: `${firstName} ${lastName}`.trim(),
        updated_at: new Date().toISOString(),
      };

      if (editingLog) {
        // --- EDIT MODE ---
        const imageUrls = { ...(editingLog.images || {}) };
        const imagesToUpload = Object.entries(imageFiles).filter(([, file]) => file);
        setUploadProgress({ current: 0, total: imagesToUpload.length });

        for (const [key, file] of imagesToUpload) {
          const url = await uploadImage(file!);
          imageUrls[key as keyof typeof imageUrls] = url;
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      
        const response = await supabase.from('trip_logs').update({
          ...baseData,
          images: imageUrls,
          edit_count: editingLog.edit_count + 1,
        }).eq('id', editingLog.id);
      
        if (response.error) throw response.error;
      
        showModal({
          title: "Update Successful",
          message: "The trip log has been updated successfully.",
          type: 'success'
        });
  
      } else {
        // --- NEW LOG MODE (SYNC) ---
        const imagesToUpload = Object.entries(imageFiles).filter(([, file]) => file);
        const imageUrls: Record<string, string> = {};
        setUploadProgress({ current: 0, total: imagesToUpload.length });

        if (imagesToUpload.length > 0) {
          for (const [key, file] of imagesToUpload) {
            const url = await uploadImage(file!);
            imageUrls[key] = url;
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
            console.log(`Uploaded ${key}.`);
          }
        }

        // 1. Insert log with text data and image URLs
        const { data: newLogs, error: insertError } = await supabase
          .from('trip_logs')
          .insert({ ...baseData, images: imageUrls })
          .select();

        if (insertError) throw insertError;
        if (!newLogs || newLogs.length === 0) throw new Error("Failed to create log.");

        const newLog = newLogs[0];

        // Trigger email notification first so it ALWAYS sends before alert/navigate
        const token = await generateShareToken(newLog.id);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://symbria-delivery-logistics.vercel.app';
        const shareLink = `${origin}/share/${token}`;

        await fetch('/api/email-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...baseData,
                images: imageUrls,
                created_at: newLog.created_at,
                shareLink
            })
        }).catch(err => console.error("Email trigger failed:", err));

        // 2. Give feedback
        showModal({
          title: "Submission Successful",
          message: "Your trip log has been submitted successfully.",
          type: 'success'
        });

        // 3. Reset form and navigate away
        formElement.reset();
        resetForm();
        fetchData();
        }
  
    } catch (err) {
      console.error("Submission Error:", err);
      const errorMessage = (err as Error).message || "An unknown error occurred";
      
      // Handle specific Next.js Server Action error when app is redeployed
      if (errorMessage.toLowerCase().includes("failed to find server action")) {
        showModal({
          title: "App Update Required",
          message: "The application has been updated! Please refresh the page to submit your form. Your photos and data are still saved in this session.",
          type: 'error',
          confirmText: "Refresh Now",
          onConfirm: () => window.location.reload()
        });
      } else {
        showModal({
          title: "Submission Failed",
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
      setEditingLog(null);
    }
  }

  const visibleLogs = logs.filter(log => {
    let match = true;

    if (activeTab === 'history') {
      // Only show logs for the current user
      if (log.user_id !== userProfile?.id) return false;
    } else if (activeTab === 'all') {
      // Apply admin filters only if activeTab is 'all'
      if (filterDriver && log.driver_name && !log.driver_name.toLowerCase().includes(filterDriver.toLowerCase())) match = false;
      if (filterRoute && log.route_id !== filterRoute) match = false;
      if (filterType && log.trip_type !== filterType) match = false;
      if (filterDate) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate !== filterDate) match = false;
      }
      if (filterIssuesOnly) {
        const hasIssue = log.notes || (log.checklist && Object.keys(log.checklist).some(k => k.endsWith('_COMMENT')));
        if (!hasIssue) match = false;
      }
    } else {
      // If activeTab is 'new' or 'my-info', no logs should be displayed in this table context
      return false;
    }
    return match;
  });

  const currentQuestions = tripType === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;

  if (loading) return <div className="p-8 text-center text-gray-500 ">Loading...</div>;

  const renderVestibuleCleanliness = () => (
    <div className="bg-blue-50/50 p-4 md:p-6 rounded-xl border border-blue-100 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Vestibule Cleanliness</h3>
      <div className="bg-white p-4 rounded border border-gray-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <span className="block text-sm font-medium text-gray-700">Was there trash in vestibule when you arrived?</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="vestibuleTrashArrived" value="Yes" checked={checklistData["Was there trash in vestibule when you arrived?"] === "Yes"} onChange={() => handleChecklistChange("Was there trash in vestibule when you arrived?", "Yes")} className="accent-green-600 w-4 h-4" required />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="vestibuleTrashArrived" value="No" checked={checklistData["Was there trash in vestibule when you arrived?"] === "No"} onChange={() => handleChecklistChange("Was there trash in vestibule when you arrived?", "No")} className="accent-green-600 w-4 h-4" required />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>
        {checklistData["Was there trash in vestibule when you arrived?"] === "Yes" && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <span className="block text-sm font-medium text-gray-700">Was trash removed before you left?</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="vestibuleTrashRemoved" value="Yes" checked={checklistData["Was trash removed before you left?"] === "Yes"} onChange={() => handleChecklistChange("Was trash removed before you left?", "Yes")} className="accent-green-600 w-4 h-4" required />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="vestibuleTrashRemoved" value="No" checked={checklistData["Was trash removed before you left?"] === "No"} onChange={() => handleChecklistChange("Was trash removed before you left?", "No")} className="accent-red-600 w-4 h-4" required />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
            {checklistData["Was trash removed before you left?"] === "No" && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Reason for not removing trash (Optional)" 
                  value={checklistComments["Was trash removed before you left?"] || ""} 
                  onChange={(e) => handleCommentChange("Was trash removed before you left?", e.target.value)} 
                  className="border p-2 rounded w-full bg-red-50 focus:bg-white" 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gray-50  min-h-screen transition-colors">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ">Pre/Post-Trip Log</h1>
          {userProfile && (
            <p className="text-gray-500  mt-1">Welcome back, {userProfile.firstName}</p>
          )}
        </div>
        {userProfile && (
          <h3 className="text-gray-400  font-medium text-left md:text-right">
            {userProfile.firstName} {userProfile.lastName} <br />
            <span className={`uppercase text-xs tracking-wider border px-2 py-0.5 rounded-full mt-1 inline-block ${
              userProfile.role === 'Admin' ? 'border-red-300  text-red-600  bg-red-50 ' : 
              userProfile.role === 'Management' ? 'border-purple-300  text-purple-600  bg-purple-50 ' : 
              'border-gray-300 '
            }`}>
              {userProfile.role}
            </span>
          </h3>
        )}
      </header>

      {userProfile && ( // Only show tabs if user is authenticated
        <div className="flex border-b border-gray-300  mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => { setActiveTab('new');
            setEditingLog(null); setVisibleCount(5); 
          }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'new' ? 'text-blue-600  border-b-2 border-blue-600 ' : 'text-gray-500 '}`}>
            {editingLog ? `Editing #${editingLog.id}` : 'New Form'}
          </button>
          <button onClick={() => { setActiveTab('history');
            setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'history' ? 'text-blue-600  border-b-2 border-blue-600 ' : 'text-gray-500 '}`}>
            My Logs
          </button>
          <button onClick={() => { setActiveTab('all'); setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'all' ? 'text-purple-600  border-b-2 border-purple-600 ' : 'text-gray-500 '}`}>
            All Logs
          </button>
          
          {userProfile?.role === 'Admin' && (
            <button onClick={() => { setActiveTab('med-carts'); setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'med-carts' ? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '}`}>
              Med Carts
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('my-info'); setEditingLog(null); }} 
            className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'my-info' ? 'text-blue-600  border-b-2 border-blue-600 ' : 'text-gray-500 '}`}
          >
            My Info
          </button>
        </div>
      )}
      
      {activeTab === 'my-info' && userProfile && (
        <div className="bg-white  p-6 md:p-8 rounded-xl shadow-sm border border-gray-100  max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100  text-blue-600  rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
              {userProfile.firstName[0]}{userProfile.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 ">{userProfile.firstName} {userProfile.lastName}</h2>
              <p className="text-sm text-gray-500 ">{userProfile.jobTitle}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50  rounded-lg border border-gray-200 ">
                 <label className="text-xs font-bold text-gray-500  uppercase tracking-wide block mb-1">First Name</label>
                 <div className="font-medium text-gray-900 ">{userProfile.firstName}</div>
               </div>
               <div className="p-4 bg-gray-50  rounded-lg border border-gray-200 ">
                 <label className="text-xs font-bold text-gray-500  uppercase tracking-wide block mb-1">Last Name</label>
                 <div className="font-medium text-gray-900 ">{userProfile.lastName}</div>
               </div>
            </div>

            <div className="p-4 bg-gray-50  rounded-lg border border-gray-200 ">
               <label className="text-xs font-bold text-gray-500  uppercase tracking-wide block mb-1">Company Position</label>
               <div className="font-medium text-gray-900 ">{userProfile.jobTitle}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 bg-gray-50  rounded-lg border border-gray-200 ">
                 <label className="text-xs font-bold text-gray-500  uppercase tracking-wide block mb-1">Phone Number</label>
                 <div className="font-medium text-gray-900 ">{userProfile.phone}</div>
               </div>
               <div className="p-4 bg-gray-50  rounded-lg border border-gray-200 ">
                 <label className="text-xs font-bold text-gray-500  uppercase tracking-wide block mb-1">Email</label>
                 <div className="font-medium text-gray-900 ">{userProfile.email}</div>
               </div>
            </div>
          </div>



        </div>
      )}

      {activeTab === 'med-carts' && userProfile?.role === 'Admin' && (
        <div className="bg-white  p-6 md:p-8 rounded-xl shadow-sm border border-gray-100  animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-gray-900  mb-4">Med Carts Management</h2>
          <p className="text-gray-500 ">Med Carts management interface is under development.</p>
        </div>
      )}

      {userProfile && (activeTab === 'history' || activeTab === 'all') && (
        <div className="flex flex-col gap-4">
          {activeTab === 'all' && (
            <div className="bg-white  p-4 rounded-xl shadow-sm border border-gray-100  flex flex-wrap gap-4 items-end mb-2">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-500  uppercase tracking-wide mb-1">Driver Name</label>
                <input type="text" placeholder="Search driver..." value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} className="w-full border p-2 rounded bg-gray-50    outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-500  uppercase tracking-wide mb-1">Route</label>
                <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="w-full border p-2 rounded bg-gray-50    outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">All Routes</option>
                  {routeOptions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-500  uppercase tracking-wide mb-1">Trip Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full border p-2 rounded bg-gray-50    outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">All Types</option>
                  <option value="Pre-Trip">Pre-Trip</option>
                  <option value="Post-Trip">Post-Trip</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-500  uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full border p-2 rounded bg-gray-50    outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="flex items-center gap-2 mb-2 md:mb-1">
                <input 
                  type="checkbox" 
                  id="filterIssuesOnly" 
                  checked={filterIssuesOnly} 
                  onChange={(e) => setFilterIssuesOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="filterIssuesOnly" className="text-xs font-bold text-gray-700 cursor-pointer uppercase tracking-wide">
                  Issues Only 🚨
                </label>
              </div>
              <div className="flex-none w-full md:w-auto mt-2 md:mt-0">
                <button 
                  onClick={() => {
                    setFilterDriver("");
                    setFilterRoute("");
                    setFilterType("");
                    setFilterDate("");
                    setFilterIssuesOnly(false);
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300   text-gray-700  text-sm font-bold rounded transition-colors h-[38px] md:self-end"
                  aria-label="Clear Filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="bg-white  p-4 rounded-xl shadow-sm border border-gray-100 ">
            <div className="overflow-x-auto">
              <table className="w-full block md:table divide-y divide-gray-200 ">
                <thead className="bg-gray-50  hidden md:table-header-group">
                  <tr>
                    <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Date / Time
                    </th>
                    {activeTab === 'all' && <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Driver
                    </th>}
                    <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Route
                    </th>
                    <th scope="col" className="p-4 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Odometer
                    </th>
                    <th scope="col" className="p-4 text-right text-xs font-medium text-gray-500  uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent md:bg-white md: divide-y divide-transparent md:divide-gray-200  block md:table-row-group">
                  {visibleLogs.length === 0 && (
                    <tr className="block md:table-row bg-white  rounded-lg shadow-sm md:shadow-none border border-gray-100  md:border-0 p-4">
                      <td colSpan={activeTab === 'all' ? 6 : 5} className="block md:table-cell p-4 text-center text-gray-500 ">No logs found.</td>
                    </tr>
                  )}
                  {visibleLogs.slice(0, visibleCount).map((log) => {
                    const hasIssue = log.notes || (log.checklist && Object.keys(log.checklist).some(k => k.endsWith('_COMMENT')));
                    return (
                      <tr key={log.id} className={`hover:bg-gray-50  transition-colors flex flex-col md:table-row bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none border ${hasIssue ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100 '} md:border-0 mb-4 md:mb-0 relative`}>
                        <td className="p-4 block md:table-cell border-b md:border-0 border-gray-100 ">
                          <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-1">Date / Time</div>
                          <div className="whitespace-nowrap flex items-center gap-2">
                            {hasIssue && <span className="text-lg" title="Issue Reported">🚨</span>}
                            <ClientDate timestamp={log.created_at} />
                          </div>
                        </td>
                        {activeTab === 'all' && (
                        <td className="p-4 block md:table-cell border-b md:border-0 border-gray-100 ">
                          <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-1">Driver</div>
                          <div className="font-medium text-gray-900  whitespace-nowrap">{log.driver_name}</div>
                        </td>
                      )}
                      <td className="p-4 block md:table-cell border-b md:border-0 border-gray-100 ">
                        <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-1">Type</div>
                        <span className={`whitespace-nowrap px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-800  ' : 'bg-orange-100 text-orange-800  '
                        }`}>
                          {log.trip_type}
                        </span>
                      </td>
                      <td className="p-4 block md:table-cell border-b md:border-0 border-gray-100 ">
                        <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-1">Route</div>
                        <div className="whitespace-nowrap text-gray-900 ">{log.route_id}</div>
                      </td>
                      <td className="p-4 block md:table-cell border-b md:border-0 border-gray-100 ">
                        <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-1">Odometer</div>
                        <div className="whitespace-nowrap text-gray-900 ">{log.odometer}</div>
                      </td>
                      <td className="p-4 block md:table-cell text-right text-sm font-medium">
                        <div className="flex md:hidden text-xs font-bold text-gray-500  uppercase mb-3 text-left">Actions</div>
                        <div className="flex items-center justify-start md:justify-end gap-2 flex-wrap">
                          {canEditOrDelete(log) && (
                            <>
                              <button onClick={() => handleEditClick(log)} className="p-2 bg-blue-50  text-blue-600  hover:bg-blue-100  rounded-lg transition-colors" title="Edit">
                                <PencilSquareIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(log.id)} className="p-2 bg-red-50  text-red-600  hover:bg-red-100  rounded-lg transition-colors" title="Delete">
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <Link href={`/logs/${log.id}`} className="p-2 bg-gray-50  text-gray-600  hover:bg-gray-100  rounded-lg transition-colors" title="View">
                            <EyeIcon className="w-5 h-5" />
                          </Link>
                          <button onClick={() => downloadCSV(log)} className="p-2 bg-green-50  text-green-600  hover:bg-green-100  rounded-lg transition-colors" title="CSV">
                            <DocumentArrowDownIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handlePrint(log)} className="p-2 bg-purple-50  text-purple-600  hover:bg-purple-100  rounded-lg transition-colors" title="Print">
                            <PrinterIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            
            {visibleLogs.length > visibleCount && (
              <div className="text-center mt-6">
                <button onClick={() => setVisibleCount(prev => prev + 5)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition">
                  Load More
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Main Form */}
      {(!userProfile || activeTab === 'new') && (
        <div className="bg-white  p-4 md:p-6 rounded-xl shadow-sm border border-gray-100  max-w-4xl">
          <h2 className="text-xl font-semibold mb-2 text-gray-900 ">
            {editingLog ? `Editing Log #${editingLog.id}` : "Submit New Pre/Post Trip Inspection"}
          </h2>
          <p className="text-sm text-gray-500  mb-6 italic">Ensure you select &quot;Post-Trip Inspection&quot; when you return at the end of your shift.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4">
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-semibold text-gray-700 ">First Name</span>
                <input name="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border p-3 rounded bg-white   " required />
              </label>
              <label className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-semibold text-gray-700 ">Last Name</span>
                <input name="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border p-3 rounded bg-white   " required />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 ">Trip Type</span>
              <select name="trip_type" value={tripType} onChange={(e) => setTripType(e.target.value)} className="border p-3 rounded bg-white   " required>
                <option value="Pre-Trip">Pre-Trip Inspection</option>
                <option value="Post-Trip">Post-Trip Inspection</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 ">Select Route</span>
              <select name="route_id" value={routeId} onChange={(e) => setRouteId(e.target.value)} className="border p-3 rounded-lg bg-white   " required>
                <option value="" disabled>-- Choose a Route --</option>
                {routeOptions.length > 0 ? (
                  routeOptions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                ) : (
                  <option disabled>Loading routes...</option>
                )}
              </select>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 ">Odometer</span>
              <input name="odometer" type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} className="border p-3 rounded bg-white   " required />
            </label>

            <hr className="border-gray-200 " />
            
            {tripType === 'Pre-Trip' && renderVestibuleCleanliness()}

            <div>
               <h3 className="text-lg font-bold text-gray-800  mb-4">Inspection Checklist</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {currentQuestions.map((question, index) => {
                   const answer = checklistData[question];
                   const showComment = requiresDescription(question, answer);
                   const isBad = showComment;
                   return (
                     <div key={index} className={`flex flex-col bg-gray-50  p-3 rounded border ${isBad ? 'border-red-200  bg-red-50 ' : 'border-gray-100 '}`}>
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-sm text-gray-700  font-medium max-w-[70%]">{question}</span>
                         <div className="flex gap-4">
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="Yes" checked={answer === "Yes"} onChange={() => handleChecklistChange(question, "Yes")} className="accent-green-600 w-4 h-4" required />
                             <span className="text-sm ">Yes</span>
                           </label>
                           <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name={`q-${index}`} value="No" checked={answer === "No"} onChange={() => handleChecklistChange(question, "No")} className="accent-red-600 w-4 h-4" />
                             <span className="text-sm ">No</span>
                           </label>
                         </div>
                       </div>

                       {tripType === 'Post-Trip' && question === "Fuel Tank Full" && answer === "Yes" && (
                        <div className="mt-2 p-3 bg-blue-50/50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-1">
                          <span className="block text-[10px] font-bold text-blue-700 uppercase mb-2">📸 Photo of Fuel Gauge (Required)</span>
                          <ImageUploadInput 
                            onChange={(file) => handleFileChange('fuelGauge', file)} 
                            file={imageFiles.fuelGauge} 
                            loading={compressing.fuelGauge}
                            required={tripType === 'Post-Trip' && !editingLog?.images?.fuelGauge} 
                          />
                          {editingLog?.images?.fuelGauge && <a href={editingLog.images.fuelGauge} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                        </div>
                       )}

                       {showComment && (
                         <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                           <input type="text" placeholder="Describe issue (Required)" value={checklistComments[question] || ""} onChange={(e) => handleCommentChange(question, e.target.value)} className="w-full text-sm border border-red-300 rounded p-2 focus:outline-none focus:border-red-500 text-red-700  placeholder-red-300  bg-white " required />
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>

            {tripType === 'Post-Trip' && (
              <>
                <hr className="border-gray-200 " />
                <div>
                  <h3 className="text-lg font-bold text-gray-800  mb-4">Scanner</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SCANNER_QUESTIONS.map((question, index) => {
                      const answer = checklistData[question];
                      const showComment = requiresDescription(question, answer);
                      const isBad = showComment;
                      return (
                        <div key={`scanner-${index}`} className={`flex flex-col bg-gray-50  p-3 rounded border ${isBad ? 'border-red-200  bg-red-50 ' : 'border-gray-100 '}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-700  font-medium max-w-[70%]">{question}</span>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name={`scanner-q-${index}`} value="Yes" checked={answer === "Yes"} onChange={() => handleChecklistChange(question, "Yes")} className="accent-green-600 w-4 h-4" required />
                                <span className="text-sm ">Yes</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name={`scanner-q-${index}`} value="No" checked={answer === "No"} onChange={() => handleChecklistChange(question, "No")} className="accent-red-600 w-4 h-4" />
                                <span className="text-sm ">No</span>
                              </label>
                            </div>
                          </div>

                          {showComment && (
                            <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                              <input type="text" placeholder="Describe issue (Required)" value={checklistComments[question] || ""} onChange={(e) => handleCommentChange(question, e.target.value)} className="w-full text-sm border border-red-300 rounded p-2 focus:outline-none focus:border-red-500 text-red-700  placeholder-red-300  bg-white " required />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {tripType === 'Post-Trip' && (
              <>
                <hr className="border-gray-200 " />
                <div>
                  <h3 className="text-lg font-bold text-gray-800  mb-4">Keys</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {KEY_QUESTIONS.map((question, index) => {
                      const answer = checklistData[question];
                      const showComment = requiresDescription(question, answer);
                      const isBad = showComment;
                      return (
                        <div key={`key-${index}`} className={`flex flex-col bg-gray-50  p-3 rounded border ${isBad ? 'border-red-200  bg-red-50 ' : 'border-gray-100 '}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-700  font-medium max-w-[70%]">{question}</span>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name={`key-q-${index}`} value="Yes" checked={answer === "Yes"} onChange={() => handleChecklistChange(question, "Yes")} className="accent-green-600 w-4 h-4" required />
                                <span className="text-sm ">Yes</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name={`key-q-${index}`} value="No" checked={answer === "No"} onChange={() => handleChecklistChange(question, "No")} className="accent-red-600 w-4 h-4" />
                                <span className="text-sm ">No</span>
                              </label>
                            </div>
                          </div>

                          {showComment && (
                            <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                              <input type="text" placeholder="Describe issue (Required)" value={checklistComments[question] || ""} onChange={(e) => handleCommentChange(question, e.target.value)} className="w-full text-sm border border-red-300 rounded p-2 focus:outline-none focus:border-red-500 text-red-700  placeholder-red-300  bg-white " required />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {tripType === 'Post-Trip' && (
              <div className="bg-orange-50/30 p-4 md:p-6 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">💊 Med Returns</h3>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700 mb-2">Did you have to bring back any meds?</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="hadReturns" value="Yes" checked={medReturnData.hadReturns === "Yes"} onChange={() => setMedReturnData(prev => ({ ...prev, hadReturns: "Yes" }))} className="accent-orange-600 w-4 h-4" required={tripType === 'Post-Trip'} />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="hadReturns" value="No" checked={medReturnData.hadReturns === "No"} onChange={() => setMedReturnData(prev => ({ ...prev, hadReturns: "No" }))} className="accent-orange-600 w-4 h-4" />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  {medReturnData.hadReturns === 'Yes' && (
                    <div className="space-y-4 mt-2 animate-in fade-in slide-in-from-top-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-700">Reason for return (Optional)</span>
                        <input 
                          type="text" 
                          placeholder="ex, 'Per Nurse, patient discharged', etc" 
                          value={medReturnData.reason} 
                          onChange={(e) => setMedReturnData(prev => ({ ...prev, reason: e.target.value }))}
                          className="border p-3 rounded bg-white text-sm focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all" 
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-700">Facility / Nurse Station (Required)</span>
                        <input 
                          type="text" 
                          placeholder="ex, 'Overlook OLPAT1', etc" 
                          value={medReturnData.facilityPatient} 
                          onChange={(e) => setMedReturnData(prev => ({ ...prev, facilityPatient: e.target.value }))}
                          className="border p-3 rounded bg-white text-sm focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all" 
                          required={medReturnData.hadReturns === 'Yes'}
                        />
                      </label>

                      <div className="flex flex-col bg-white p-3 rounded border border-gray-200">
                        <span className="text-sm font-semibold text-gray-700 mb-2">Meds handed to Pharmacy or placed in dropbox?</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="handedToPharmacy" value="Yes" checked={medReturnData.handedToPharmacy === "Yes"} onChange={() => setMedReturnData(prev => ({ ...prev, handedToPharmacy: "Yes" }))} className="accent-orange-600 w-4 h-4" required={medReturnData.hadReturns === 'Yes'} />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="handedToPharmacy" value="No" checked={medReturnData.handedToPharmacy === "No"} onChange={() => setMedReturnData(prev => ({ ...prev, handedToPharmacy: "No" }))} className="accent-orange-600 w-4 h-4" />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col bg-white p-3 rounded border border-gray-200">
                        <span className="text-sm font-semibold text-gray-700 mb-2">Meds require refrigeration?</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="needsRefrigeration" value="Yes" checked={medReturnData.needsRefrigeration === "Yes"} onChange={() => setMedReturnData(prev => ({ ...prev, needsRefrigeration: "Yes" }))} className="accent-orange-600 w-4 h-4" required={medReturnData.hadReturns === 'Yes'} />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="needsRefrigeration" value="No" checked={medReturnData.needsRefrigeration === "No"} onChange={() => setMedReturnData(prev => ({ ...prev, needsRefrigeration: "No" }))} className="accent-orange-600 w-4 h-4" />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      </div>

                      {medReturnData.needsRefrigeration === 'Yes' && (
                        <div className="flex flex-col bg-blue-50 p-3 rounded border border-blue-200 animate-in fade-in slide-in-from-top-1 shadow-sm">
                          <span className="text-sm font-bold text-blue-800 mb-2">Meds placed in refrigerator?</span>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="placedInFridge" value="Yes" checked={medReturnData.placedInFridge === "Yes"} onChange={() => setMedReturnData(prev => ({ ...prev, placedInFridge: "Yes" }))} className="accent-blue-600 w-4 h-4" required={medReturnData.needsRefrigeration === 'Yes'} />
                              <span className="text-sm font-bold text-blue-900">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="placedInFridge" value="No" checked={medReturnData.placedInFridge === "No"} onChange={() => setMedReturnData(prev => ({ ...prev, placedInFridge: "No" }))} className="accent-blue-600 w-4 h-4" />
                              <span className="text-sm font-bold text-blue-900">No</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tripType === 'Post-Trip' && (
              <>
                <hr className="border-gray-200 " />
                <div className="bg-blue-50/50 p-4 md:p-6 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800  mb-4">Tackle Box Deliveries</h3>
                  
                  {/* Step 1: Included? */}
                  <div className="flex flex-col gap-2 mb-6">
                    <span className="text-sm font-semibold text-gray-700 ">Were tackle boxes included in today&apos;s delivery?</span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tackle-included" value="Yes" checked={tackleBoxesIncluded === 'Yes'} onChange={() => setTackleBoxesIncluded('Yes')} className="accent-blue-600 w-4 h-4" required={tripType === 'Post-Trip'} />
                        <span className="text-sm font-medium">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tackle-included" value="No" checked={tackleBoxesIncluded === 'No'} onChange={() => { setTackleBoxesIncluded('No'); setTackleBoxDeliveries([]); }} className="accent-blue-600 w-4 h-4" />
                        <span className="text-sm font-medium">No</span>
                      </label>
                    </div>
                  </div>

                  {tackleBoxesIncluded === 'Yes' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      {/* Step 2: Select Locations */}
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-700 ">Which locations received tackle boxes?</span>
                        {!routeId ? (
                          <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">Please select a route above first to see available locations.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {(ROUTE_STOPS[routeId] || []).map(facility => {
                              const isSelected = tackleBoxDeliveries.some(d => d.location === facility);
                              return (
                                <label key={facility} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-300 ' : 'bg-white  border-gray-200  hover:bg-gray-50 '}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTackleBoxDeliveries(prev => [...prev, { 
                                          location: facility, 
                                          deliveredCount: "", 
                                          nurseEmptied: null,
                                          emptiedReturnedCount: "",
                                          returnedToPharmacy: false,
                                          unemptiedReturnedCount: "",
                                          medsNeedRefrigeration: null,
                                          medsMovedToFridge: false
                                        }]);
                                      } else {
                                        setTackleBoxDeliveries(prev => prev.filter(d => d.location !== facility));
                                      }
                                    }}
                                    className="accent-blue-600 w-4 h-4"
                                  />
                                  <span className="text-[10px] md:text-xs font-medium">{facility}</span>
                                </label>
                              );
                            })}
                            {(!ROUTE_STOPS[routeId] || ROUTE_STOPS[routeId].length === 0) && (
                              <p className="text-xs text-gray-500 col-span-full italic">No locations configured for this route.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step 3: Detailed Info for each location */}
                      {tackleBoxDeliveries.map((delivery, index) => (
                        <div key={delivery.location} className="bg-white  p-4 rounded-lg border border-blue-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="font-bold text-blue-800 ">{delivery.location}</h4>
                            <button type="button" onClick={() => setTackleBoxDeliveries(prev => prev.filter(d => d.location !== delivery.location))} className="text-red-500 hover:text-red-700 transition-colors">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-gray-600 ">How many tackle boxes delivered?</span>
                              <input 
                                type="number" 
                                value={delivery.deliveredCount} 
                                onChange={(e) => {
                                  const newDeliveries = [...tackleBoxDeliveries];
                                  newDeliveries[index].deliveredCount = e.target.value;
                                  setTackleBoxDeliveries(newDeliveries);
                                }}
                                className="border p-2 rounded text-sm bg-gray-50  focus:bg-white  transition-colors"
                                placeholder="Count"
                                required
                              />
                            </label>

                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-gray-600 ">Nurse emptied at time of delivery?</span>
                              <div className="flex gap-4 mt-1">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name={`emptied-${index}`} 
                                    checked={delivery.nurseEmptied === 'Yes'} 
                                    onChange={() => {
                                      const newDeliveries = [...tackleBoxDeliveries];
                                      newDeliveries[index].nurseEmptied = 'Yes';
                                      newDeliveries[index].returnedToPharmacy = false;
                                      newDeliveries[index].unemptiedReturnedCount = "";
                                      newDeliveries[index].medsNeedRefrigeration = null;
                                      newDeliveries[index].medsMovedToFridge = false;
                                      setTackleBoxDeliveries(newDeliveries);
                                    }}
                                    className="accent-green-600"
                                    required
                                  />
                                  <span className="text-xs">Yes</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name={`emptied-${index}`} 
                                    checked={delivery.nurseEmptied === 'No'} 
                                    onChange={() => {
                                      const newDeliveries = [...tackleBoxDeliveries];
                                      newDeliveries[index].nurseEmptied = 'No';
                                      newDeliveries[index].emptiedReturnedCount = "";
                                      setTackleBoxDeliveries(newDeliveries);
                                    }}
                                    className="accent-red-600"
                                  />
                                  <span className="text-xs">No</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {delivery.nurseEmptied === 'Yes' && (
                            <label className="flex flex-col gap-1 animate-in slide-in-from-top-1">
                              <span className="text-xs font-semibold text-gray-600 ">How many empty tackle boxes returned?</span>
                              <input 
                                type="number" 
                                value={delivery.emptiedReturnedCount || ""} 
                                onChange={(e) => {
                                  const newDeliveries = [...tackleBoxDeliveries];
                                  newDeliveries[index].emptiedReturnedCount = e.target.value;
                                  setTackleBoxDeliveries(newDeliveries);
                                }}
                                className="border p-2 rounded text-sm bg-gray-50  focus:bg-white  transition-colors"
                                placeholder="Count"
                                required
                              />
                            </label>
                          )}

                          {delivery.nurseEmptied === 'No' && (
                            <div className="space-y-4 animate-in slide-in-from-top-1">
                              <div className="bg-red-50  p-3 rounded border border-red-100  space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={!!delivery.returnedToPharmacy} 
                                    onChange={(e) => {
                                      const newDeliveries = [...tackleBoxDeliveries];
                                      newDeliveries[index].returnedToPharmacy = e.target.checked;
                                      setTackleBoxDeliveries(newDeliveries);
                                    }}
                                    className="accent-red-600 w-4 h-4"
                                    required
                                  />
                                  <span className="text-xs font-bold text-red-700 ">Tackle box returned to pharmacy?</span>
                                </label>

                                {delivery.returnedToPharmacy && (
                                  <label className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-red-600 ">How many unemptied tackle boxes returned?</span>
                                    <input 
                                      type="number" 
                                      value={delivery.unemptiedReturnedCount || ""} 
                                      onChange={(e) => {
                                        const newDeliveries = [...tackleBoxDeliveries];
                                        newDeliveries[index].unemptiedReturnedCount = e.target.value;
                                        setTackleBoxDeliveries(newDeliveries);
                                      }}
                                      className="border p-2 rounded text-sm bg-white  border-red-200"
                                      placeholder="Count"
                                      required
                                    />
                                  </label>
                                )}
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-gray-600 ">Any meds need refrigeration?</span>
                                <div className="flex gap-4 mt-1">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`refrig-${index}`} 
                                      checked={delivery.medsNeedRefrigeration === 'Yes'} 
                                      onChange={() => {
                                        const newDeliveries = [...tackleBoxDeliveries];
                                        newDeliveries[index].medsNeedRefrigeration = 'Yes';
                                        setTackleBoxDeliveries(newDeliveries);
                                      }}
                                      className="accent-blue-600"
                                      required
                                    />
                                    <span className="text-xs">Yes</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name={`refrig-${index}`} 
                                      checked={delivery.medsNeedRefrigeration === 'No'} 
                                      onChange={() => {
                                        const newDeliveries = [...tackleBoxDeliveries];
                                        newDeliveries[index].medsNeedRefrigeration = 'No';
                                        newDeliveries[index].medsMovedToFridge = false;
                                        setTackleBoxDeliveries(newDeliveries);
                                      }}
                                      className="accent-blue-600"
                                    />
                                    <span className="text-xs">No</span>
                                  </label>
                                </div>
                              </div>

                              {delivery.medsNeedRefrigeration === 'Yes' && (
                                <label className="flex items-center gap-2 p-3 bg-blue-50  border border-blue-200 rounded cursor-pointer animate-in slide-in-from-top-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!delivery.medsMovedToFridge} 
                                    onChange={(e) => {
                                      const newDeliveries = [...tackleBoxDeliveries];
                                      newDeliveries[index].medsMovedToFridge = e.target.checked;
                                      setTackleBoxDeliveries(newDeliveries);
                                    }}
                                    className="accent-blue-600 w-4 h-4"
                                    required
                                  />
                                  <span className="text-xs font-bold text-blue-700 ">Meds taken out of tackle box and put in refrigerator?</span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

                        <hr className="border-gray-200 " />
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-800  mb-4">Tire Pressure (PSI) (Required)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 ">Driver Front</span><input type="number" placeholder="PSI" value={tirePressures.df} onChange={(e) => handleTireChange('df', e.target.value)} className="border p-3 rounded bg-white   " required /></label>
                            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 ">Passenger Front</span><input type="number" placeholder="PSI" value={tirePressures.pf} onChange={(e) => handleTireChange('pf', e.target.value)} className="border p-3 rounded bg-white   " required /></label>
                            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 ">Driver Rear</span><input type="number" placeholder="PSI" value={tirePressures.dr} onChange={(e) => handleTireChange('dr', e.target.value)} className="border p-3 rounded bg-white   " required /></label>
                            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-600 ">Passenger Rear</span><input type="number" placeholder="PSI" value={tirePressures.pr} onChange={(e) => handleTireChange('pr', e.target.value)} className="border p-3 rounded bg-white   " required /></label>
                          </div>
                        </div>
            
                        <hr className="border-gray-200 " />
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-800  mb-2">Tire Photos (Required)</h3>
                          <p className="text-sm text-gray-500  mb-4">Ensure photos are well lit and not blurry.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                              <span className="block text-sm font-semibold text-gray-700  mb-2">Driver Front Tire</span>
                              <ImageUploadInput onChange={(file) => handleFileChange('driverFrontTire', file)} file={imageFiles.driverFrontTire} loading={compressing.driverFrontTire} required={!editingLog?.images?.driverFrontTire} />
                              {editingLog?.images?.driverFrontTire && <a href={editingLog.images.driverFrontTire} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                            </div>
                            <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                              <span className="block text-sm font-semibold text-gray-700  mb-2">Passenger Front Tire</span>
                              <ImageUploadInput onChange={(file) => handleFileChange('passengerFrontTire', file)} file={imageFiles.passengerFrontTire} loading={compressing.passengerFrontTire} required={!editingLog?.images?.passengerFrontTire} />
                              {editingLog?.images?.passengerFrontTire && <a href={editingLog.images.passengerFrontTire} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                            </div>
                            <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                              <span className="block text-sm font-semibold text-gray-700  mb-2">Driver Rear Tire</span>
                              <ImageUploadInput onChange={(file) => handleFileChange('driverRearTire', file)} file={imageFiles.driverRearTire} loading={compressing.driverRearTire} required={!editingLog?.images?.driverRearTire} />
                              {editingLog?.images?.driverRearTire && <a href={editingLog.images.driverRearTire} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                            </div>
                            <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                              <span className="block text-sm font-semibold text-gray-700  mb-2">Passenger Rear Tire</span>
                              <ImageUploadInput onChange={(file) => handleFileChange('passengerRearTire', file)} file={imageFiles.passengerRearTire} loading={compressing.passengerRearTire} required={!editingLog?.images?.passengerRearTire} />
                              {editingLog?.images?.passengerRearTire && <a href={editingLog.images.passengerRearTire} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                            </div>
                          </div>
                        </div>
            
                                    <div>
              <h3 className="text-lg font-bold text-gray-800  mb-2">Exterior Photos (Required)</h3>
              <p className="text-sm text-gray-500  mb-4">Ensure photos are well lit and not blurry.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
		  <span className="block text-sm font-semibold text-gray-700  mb-2">Front of Vehicle</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('front', file)} file={imageFiles.front} loading={compressing.front} required={!editingLog?.images?.front} />
                  {editingLog?.images?.front && <a href={editingLog.images.front} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Driver Side</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('driverSide', file)} file={imageFiles.driverSide} loading={compressing.driverSide} required={!editingLog?.images?.driverSide} />
                  {editingLog?.images?.driverSide && <a href={editingLog.images.driverSide} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Rear of Vehicle</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('rear', file)} file={imageFiles.rear} loading={compressing.rear} required={!editingLog?.images?.rear} />
                  {editingLog?.images?.rear && <a href={editingLog.images.rear} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Passenger Side</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('passengerSide', file)} file={imageFiles.passengerSide} loading={compressing.passengerSide} required={!editingLog?.images?.passengerSide} />
                  {editingLog?.images?.passengerSide && <a href={editingLog.images.passengerSide} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
              </div>
            </div>

            <hr className="border-gray-200 " />

            <div>
              <h3 className="text-lg font-bold text-gray-800  mb-2">Interior Photos (Required)</h3>
              <p className="text-sm text-gray-500  mb-4">Ensure photos are well lit and not blurry.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Front Seat Area</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('frontSeat', file)} file={imageFiles.frontSeat} loading={compressing.frontSeat} required={!editingLog?.images?.frontSeat} />
                  {editingLog?.images?.frontSeat && <a href={editingLog.images.frontSeat} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Back Seat</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('back', file)} file={imageFiles.back} loading={compressing.back} required={!editingLog?.images?.back} />
                  {editingLog?.images?.back && <a href={editingLog.images.back} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
                <div className="bg-gray-50  p-4 rounded border border-gray-200 ">
                  <span className="block text-sm font-semibold text-gray-700  mb-2">Trunk</span>
                  <ImageUploadInput onChange={(file) => handleFileChange('trunk', file)} file={imageFiles.trunk} loading={compressing.trunk} required={!editingLog?.images?.trunk} />
                  {editingLog?.images?.trunk && <a href={editingLog.images.trunk} target="_blank" className="text-xs text-blue-600  mt-2 block underline">View Current Image</a>}
                </div>
              </div>
            </div>

            {tripType === 'Post-Trip' && renderVestibuleCleanliness()}

            <hr className="border-gray-200 " />
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-700 ">Additional Notes / Defects</span>
              <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="border p-3 rounded bg-white   " rows={3} placeholder="General notes..." />
            </label>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" disabled={submitting} className={`flex-1 font-bold py-3 px-6 rounded text-white flex items-center justify-center gap-2 transition-all ${submitting ? "bg-gray-400 cursor-wait" : (editingLog ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700')}`}>
                {submitting ? ( 
                  <>
                    <ArrowUpTrayIcon className="w-5 h-5 animate-bounce" />
                    Uploading {uploadProgress.current}/{uploadProgress.total}...
                  </> 
                ) : ( editingLog ? "Update Log" : "Submit Log" )}
              </button>
              {editingLog && (
                <button 
                  type="button" 
                  onClick={() => { setEditingLog(null); resetForm(); setActiveTab('history'); }} 
                  disabled={submitting} 
                  className="font-bold py-3 px-6 rounded bg-red-100 text-red-700 hover:bg-red-200    transition-all"
                >
                  Cancel Edit
                </button>
              )}
              <button type="button" onClick={resetForm} disabled={submitting} className="font-bold py-3 px-6 rounded bg-gray-200 text-gray-700 hover:bg-gray-300    transition-all">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM MODAL */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${
                  modalConfig.type === 'success' ? 'bg-green-100 text-green-600' :
                  modalConfig.type === 'error' ? 'bg-red-100 text-red-600' :
                  modalConfig.type === 'confirm' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {modalConfig.type === 'success' && <CheckCircleIcon className="w-8 h-8" />}
                  {modalConfig.type === 'error' && <XCircleIcon className="w-8 h-8" />}
                  {modalConfig.type === 'confirm' && <ExclamationTriangleIcon className="w-8 h-8" />}
                  {modalConfig.type === 'info' && <InformationCircleIcon className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{modalConfig.title}</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{modalConfig.message}</p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
              <button
                onClick={() => {
                  const callback = modalConfig.onConfirm;
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                  if (callback) {
                    // Small delay to allow state to settle if opening another modal
                    setTimeout(() => callback(), 100);
                  }
                }}
                className={`px-5 py-2.5 rounded-lg font-bold text-white transition-all ${
                  modalConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  modalConfig.type === 'confirm' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modalConfig.confirmText || 'OK'}
              </button>
              
              {modalConfig.type === 'confirm' && (
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {modalConfig.cancelText || 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
