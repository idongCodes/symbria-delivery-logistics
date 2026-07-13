"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { createClient } from "@/lib/supabase/client";
import { generateShareToken } from "@/app/actions/log-actions";
import { deleteRoute, updateRoute, createRoute } from "@/app/actions/route-actions";
import { deleteFacility, updateFacility, createFacility } from "@/app/actions/facility-actions";
import { deleteProfile, updateProfile, createProfile } from "@/app/actions/profile-actions";
import imageCompression from "browser-image-compression";
import { EyeIcon, PencilSquareIcon, TrashIcon, DocumentArrowDownIcon, PrinterIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon, ArrowUpTrayIcon, Bars3Icon, UserPlusIcon, ChevronDownIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import ClientDate from "@/app/components/ClientDate";
import FeedbackTab from "@/app/components/FeedbackTab";
import ImageUploadInput from "@/app/components/ImageUploadInput";

// --- CONFIGURATION: QUESTIONS LISTS ---

const PRE_TRIP_QUESTIONS = [
  "Interior clean of debris, bins/bags organised in trunk",
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
  "Interior clean of debris, bins/bags organised in trunk",
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

const ROUTE_STOPS: Record<string, string[]> = {};

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
  edit_history?: any[];
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
interface RouteOption {
  id: number;
  name: string;
}

interface FacilityOption {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
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
  const [facilityOptions, setFacilityOptions] = useState<FacilityOption[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all' | 'my-info' | 'med-carts' | 'driver-management' | 'route-management' | 'feedback'>('new');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [editingRouteName, setEditingRouteName] = useState("");
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [facilitySearch, setFacilitySearch] = useState("");

  const [expandedFacilityId, setExpandedFacilityId] = useState<number | null>(null);
  const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);
  const [editingFacilityData, setEditingFacilityData] = useState<{name: string, address: string, phone: string}>({ name: "", address: "", phone: "" });
  const [isAddingFacility, setIsAddingFacility] = useState(false);
    const [driverOptions, setDriverOptions] = useState<any[]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriverData, setEditingDriverData] = useState<{first_name: string, last_name: string, email: string, phone: string, role: string, job_title: string}>({ first_name: "", last_name: "", email: "", phone: "", role: "", job_title: "" });
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverData, setNewDriverData] = useState<{first_name: string, last_name: string, email: string, phone: string, role: string, job_title: string}>({ first_name: "", last_name: "", email: "", phone: "", role: "Driver", job_title: "Delivery Driver" });
  const [newFacilityData, setNewFacilityData] = useState<{name: string, address: string, phone: string}>({ name: "", address: "", phone: "" });

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
  const [visibleFacilityCount, setVisibleFacilityCount] = useState(5);
  const [activeTooltipLogId, setActiveTooltipLogId] = useState<number | null>(null);

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
    setImageFiles({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null });
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
  }>({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null });

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
    };

    let exteriorImagesHtml = "";
    let tireImagesHtml = "";
    let interiorImagesHtml = "";

    if (log.images) {
      const exteriorKeys = ["front", "driverSide", "rear", "passengerSide"];
      const tireKeys = ["driverFrontTire", "passengerFrontTire", "driverRearTire", "passengerRearTire"];
      const interiorKeys = ["frontSeat", "back", "trunk"];

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

      if (log.trip_type === 'Post-Trip') {
        exteriorImagesHtml = generateImageHtml(exteriorKeys, "Exterior Photos");
        tireImagesHtml = generateImageHtml(tireKeys, "Tire Photos");
        interiorImagesHtml = generateImageHtml(interiorKeys, "Interior Photos");
      }
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
            <span>Rx Delivery Logistics</span>
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
            Rx Delivery Logistics Digital Dashboard
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
    setImageFiles({ front: null, back: null, trunk: null, driverSide: null, passengerSide: null, rear: null, driverFrontTire: null, passengerFrontTire: null, driverRearTire: null, passengerRearTire: null, frontSeat: null });

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

      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name, address, phone')
        .eq('active', true)
        .order('name');
        
      if (facilityError) console.error("Facility Error:", facilityError);
      if (facilityData) setFacilityOptions(facilityData);

      const { data: driverData, error: driverError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');
        
      if (driverError) console.error("Driver Error:", driverError);
      if (driverData) setDriverOptions(driverData);

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
  const handleFileChange = async (key: 'front' | 'frontSeat' | 'back' | 'trunk' | 'driverSide' | 'passengerSide' | 'rear' | 'driverFrontTire' | 'passengerFrontTire' | 'driverRearTire' | 'passengerRearTire', file: File | null) => {
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
      
        // --- Calculate Changes for Update Email & History ---
        const changes: { field: string, old: any, new: any }[] = [];

        if (editingLog.route_id !== baseData.route_id) changes.push({ field: "Route", old: editingLog.route_id, new: baseData.route_id });
        if (editingLog.odometer !== baseData.odometer) changes.push({ field: "Odometer", old: editingLog.odometer, new: baseData.odometer });
        if (editingLog.notes !== baseData.notes) changes.push({ field: "Notes", old: editingLog.notes, new: baseData.notes });
        if (editingLog.trip_type !== baseData.trip_type) changes.push({ field: "Trip Type", old: editingLog.trip_type, new: baseData.trip_type });
        
        // Checklist diff
        const oldChecklist = (editingLog.checklist as Record<string, any>) || {};
        const newChecklist = baseData.checklist as Record<string, any>;
        const allKeys = Array.from(new Set([...Object.keys(oldChecklist), ...Object.keys(newChecklist)]));
        allKeys.forEach(key => {
          const oldVal = typeof oldChecklist[key] === 'object' ? JSON.stringify(oldChecklist[key]) : oldChecklist[key];
          const newVal = typeof newChecklist[key] === 'object' ? JSON.stringify(newChecklist[key]) : newChecklist[key];
          if (oldVal !== newVal) {
            changes.push({ field: key, old: oldChecklist[key], new: newChecklist[key] });
          }
        });

        const newEditHistoryEntry = {
            editor_name: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'System',
            edited_at: new Date().toISOString(),
            changes: changes
        };

        const existingHistory = Array.isArray(editingLog.edit_history) ? editingLog.edit_history : [];
        const newEditHistory = changes.length > 0 ? [...existingHistory, newEditHistoryEntry] : existingHistory;

        const response = await supabase.from('trip_logs').update({
          ...baseData,
          images: imageUrls,
          edit_count: editingLog.edit_count + 1,
          edit_history: newEditHistory
        }).eq('id', editingLog.id);
      
        if (response.error) throw response.error;

        // Trigger update email
        if (changes.length > 0) {
          const token = await generateShareToken(editingLog.id);
          const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
          const shareLink = `${origin}/share/${token}`;

          await fetch('/api/email-log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  isUpdate: true,
                  changes: changes,
                  driver_name: baseData.driver_name,
                  trip_type: baseData.trip_type,
                  route_id: baseData.route_id,
                  odometer: baseData.odometer,
                  shareLink
              })
          }).catch(err => console.error("Update Email trigger failed:", err));
        }

        showModal({
          title: "Update Successful",
          message: "The trip log has been updated successfully.",
          type: 'success'
        });

        resetForm();
        fetchData();
        if (userProfile?.role === 'Admin' || userProfile?.role === 'Management') {
          setActiveTab('all');
        } else {
          setActiveTab('history');
        }
  
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
        const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
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
      // Only show logs that match the authenticated user's name (case-insensitive)
      const profileName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim().toLowerCase();
      const driverName = (log.driver_name || '').trim().toLowerCase();
      if (profileName !== driverName) return false;
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

  const handleAddRoute = () => {
    if (!newRouteName.trim()) return;
    
    showModal({
      title: 'Add New Route',
      message: 'Are you sure you want to add this new route to the database?',
      type: 'confirm',
      confirmText: 'Add Route',
      onConfirm: async () => {
        const name = newRouteName.trim();
        setIsAddingRoute(false);
        setNewRouteName("");
        
        const result = await createRoute(name);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to add route',
            type: 'error'
          });
        } else if (result.route) {
          // Update local state to reflect new route
          setRouteOptions(prev => [...prev, { id: result.route!.id, name: result.route!.name }]);
          showModal({
            title: 'Route Added',
            message: `Successfully added the route "${name}".`,
            type: 'success'
          });
        }
      }
    });
  };

  const handleUpdateRoute = (routeId: number) => {
    if (!editingRouteName.trim()) return;
    
    showModal({
      title: 'Update Route Name',
      message: 'Are you sure you want to rename this route? This will automatically update all historical trip logs that used the old name.',
      type: 'confirm',
      confirmText: 'Save Changes',
      onConfirm: async () => {
        // Optimistic UI update
        const previousRoutes = [...routeOptions];
        const newName = editingRouteName.trim();
        setRouteOptions(routeOptions.map(r => r.id === routeId ? { ...r, name: newName } : r));
        setEditingRouteId(null);
        
        const result = await updateRoute(routeId, newName);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to update route',
            type: 'error'
          });
          setRouteOptions(previousRoutes); // Revert optimistic update
        } else {
          showModal({
            title: 'Route Updated',
            message: `Successfully renamed the route to "${newName}".`,
            type: 'success'
          });
        }
      }
    });
  };

  const handleDeleteRoute = (routeId: number) => {
    showModal({
      title: 'Delete Route',
      message: 'Are you sure you want to completely delete and purge this route? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete Route',
      onConfirm: async () => {
        // Optimistic UI update
        const previousRoutes = [...routeOptions];
        setRouteOptions(routeOptions.filter(route => route.id !== routeId));
        
        const result = await deleteRoute(routeId);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to delete route',
            type: 'error'
          });
          setRouteOptions(previousRoutes); // Revert optimistic update
        }
      }
    });
  };

  const handleAddFacility = () => {
    if (!newFacilityData.name.trim()) return;
    
    showModal({
      title: 'Add New Facility',
      message: 'Are you sure you want to add this new facility to the database?',
      type: 'confirm',
      confirmText: 'Add Facility',
      onConfirm: async () => {
        const data = {
          name: newFacilityData.name.trim(),
          address: newFacilityData.address.trim(),
          phone: newFacilityData.phone.trim(),
        };
        setIsAddingFacility(false);
        setNewFacilityData({ name: "", address: "", phone: "" });
        
        const result = await createFacility(data);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to add facility',
            type: 'error'
          });
        } else if (result.facility) {
          setFacilityOptions(prev => [...prev, result.facility as any]);
          showModal({
            title: 'Facility Added',
            message: `Successfully added the facility "${data.name}".`,
            type: 'success'
          });
        }
      }
    });
  };

  const handleUpdateFacility = (facilityId: number) => {
    if (!editingFacilityData.name.trim()) return;
    
    showModal({
      title: 'Update Facility Details',
      message: 'Are you sure you want to update this facility?',
      type: 'confirm',
      confirmText: 'Save Changes',
      onConfirm: async () => {
        const previousFacilities = [...facilityOptions];
        const newData = {
          name: editingFacilityData.name.trim(),
          address: editingFacilityData.address.trim(),
          phone: editingFacilityData.phone.trim(),
        };
        setFacilityOptions(facilityOptions.map(f => f.id === facilityId ? { ...f, ...newData } : f));
        setEditingFacilityId(null);
        
        const result = await updateFacility(facilityId, newData);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to update facility',
            type: 'error'
          });
          setFacilityOptions(previousFacilities);
        } else {
          showModal({
            title: 'Facility Updated',
            message: `Successfully updated facility details.`,
            type: 'success'
          });
        }
      }
    });
  };

  const handleDeleteFacility = (facilityId: number) => {
    showModal({
      title: 'Delete Facility',
      message: 'Are you sure you want to completely delete this facility? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete Facility',
      onConfirm: async () => {
        const previousFacilities = [...facilityOptions];
        setFacilityOptions(facilityOptions.filter(f => f.id !== facilityId));
        
        const result = await deleteFacility(facilityId);
        if (!result.success) {
          showModal({
            title: 'Error',
            message: result.error || 'Failed to delete facility',
            type: 'error'
          });
          setFacilityOptions(previousFacilities);
        }
      }
    });
  };

  const filteredRoutes = routeOptions.filter(route => 
    route.name.toLowerCase().includes(routeSearch.toLowerCase())
  );

  
  const handleAddDriver = async () => {
    if (!newDriverData.first_name || !newDriverData.last_name) {
      showModal({ title: 'Validation Error', message: 'First name and Last name are required', type: 'error' });
      return;
    }
    
    setIsAddingDriver(false);
    const result = await createProfile({
      first_name: newDriverData.first_name.trim(),
      last_name: newDriverData.last_name.trim(),
      email: newDriverData.email.trim(),
      phone: newDriverData.phone.trim(),
      role: newDriverData.role.trim(),
      job_title: newDriverData.job_title.trim(),
    });

    if (result.success && result.profile) {
      setDriverOptions(prev => [...prev, result.profile]);
      setNewDriverData({ first_name: "", last_name: "", email: "", phone: "", role: "Driver", job_title: "Delivery Driver" });
      showModal({ title: 'Driver Added', message: 'Successfully added new driver.', type: 'success' });
    } else {
      showModal({ title: 'Error', message: result.error || 'Failed to add driver', type: 'error' });
    }
  };

  const handleUpdateDriver = (driverId: string) => {
    showModal({
      title: 'Update Driver',
      message: 'Are you sure you want to update this driver\'s information?',
      type: 'confirm',
      confirmText: 'Update Driver',
      onConfirm: async () => {
        const previousDrivers = [...driverOptions];
        const newData = {
          first_name: editingDriverData.first_name.trim(),
          last_name: editingDriverData.last_name.trim(),
          email: editingDriverData.email.trim(),
          phone: editingDriverData.phone.trim(),
          role: editingDriverData.role.trim(),
          job_title: editingDriverData.job_title.trim(),
        };
        setDriverOptions(driverOptions.map(d => d.id === driverId ? { ...d, ...newData } : d));
        setEditingDriverId(null);
        
        const result = await updateProfile(driverId, newData);
        if (!result.success) {
          showModal({ title: 'Error', message: result.error || 'Failed to update driver', type: 'error' });
          setDriverOptions(previousDrivers);
        } else {
          showModal({ title: 'Driver Updated', message: 'Successfully updated driver details.', type: 'success' });
        }
      }
    });
  };

  const handleDeleteDriver = (driverId: string) => {
    showModal({
      title: 'Delete Driver',
      message: 'Are you sure you want to completely delete this driver? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete Driver',
      onConfirm: async () => {
        const previousDrivers = [...driverOptions];
        setDriverOptions(driverOptions.filter(d => d.id !== driverId));
        
        const result = await deleteProfile(driverId);
        if (!result.success) {
          showModal({ title: 'Error', message: result.error || 'Failed to delete driver', type: 'error' });
          setDriverOptions(previousDrivers);
        }
      }
    });
  };

  const filteredDrivers = driverOptions.filter(driver => 
    (driver.first_name + ' ' + driver.last_name).toLowerCase().includes(driverSearch.toLowerCase()) ||
    (driver.email || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    (driver.phone || '').toLowerCase().includes(driverSearch.toLowerCase())
  );


  const filteredFacilities = facilityOptions.filter(facility => 
    facility.name.toLowerCase().includes(facilitySearch.toLowerCase()) || 
    (facility.address && facility.address.toLowerCase().includes(facilitySearch.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-gray-500 ">Loading...</div>;



  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-gray-50  min-h-screen transition-colors">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ">
            {userProfile ? 'Dashboard' : 'Pre/Post-Trip Log'}
          </h1>
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
        <>
          <div className="flex justify-end mb-2 px-2 md:hidden relative">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 shadow-sm" aria-label="Menu">
              <Bars3Icon className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            
            {isMobileMenuOpen && (
              <>
                {/* Invisible overlay to detect outside clicks */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Modal Menu */}
                <div className="absolute top-full right-2 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="flex flex-col relative z-50 py-2">
                    <button onClick={() => { setActiveTab('new'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'new' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}>
                      {editingLog ? `Editing #${editingLog.id}` : 'New Form'}
                    </button>
                    <button onClick={() => { setActiveTab('history'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'history' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}>
                      My Logs
                    </button>
                    <button onClick={() => { setActiveTab('all'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'all' ? 'text-purple-600 bg-purple-50/50' : 'text-gray-700'}`}>
                      All Logs
                    </button>
                    
                    {(userProfile?.role === 'Admin' || userProfile?.role === 'Management') && (
                      <>
                        <button onClick={() => { setActiveTab('med-carts'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'med-carts' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}`}>
                          Med Carts
                        </button>
                        <button onClick={() => { setActiveTab('driver-management'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'driver-management' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}`}>
                          Driver Management
                        </button>
                        
                        <button onClick={() => { setActiveTab('route-management'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors ${activeTab === 'route-management' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}`}>
                          Route/Location Management
                        </button>
                      </>
                    )}

                    {userProfile?.role === 'Admin' && (
                      <button onClick={() => { setActiveTab('feedback'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1 ${activeTab === 'feedback' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}`}>
                        Feedback
                      </button>
                    )}

                    <button onClick={() => { setActiveTab('my-info'); setEditingLog(null); setIsMobileMenuOpen(false); }} className={`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1 ${activeTab === 'my-info' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}>
                      My Info
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
          
          {(userProfile?.role === 'Admin' || userProfile?.role === 'Management') && (
            <>
              <button onClick={() => { setActiveTab('med-carts'); setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'med-carts' ? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '}`}>
                Med Carts
              </button>
              <button onClick={() => { setActiveTab('driver-management'); setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'driver-management' ? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '}`}>
                Driver Management
              </button>
              
              <button onClick={() => { setActiveTab('route-management'); setEditingLog(null); setVisibleCount(5); }} className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'route-management' ? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '}`}>
                Route/Location Management
              </button>
            </>
          )}

          {userProfile?.role === 'Admin' && (
            <button 
              onClick={() => { setActiveTab('feedback'); setEditingLog(null); setVisibleCount(5); }} 
              className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'feedback' ? 'text-green-600 border-b-2 border-green-600 ' : 'text-gray-500 '}`}
            >
              Feedback
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('my-info'); setEditingLog(null); }} 
            className={`px-4 md:px-6 py-3 font-medium text-sm md:text-base ${activeTab === 'my-info' ? 'text-blue-600  border-b-2 border-blue-600 ' : 'text-gray-500 '}`}
          >
            My Info
          </button>
        </div>
        </>
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

      {activeTab === 'med-carts' && (userProfile?.role === 'Admin' || userProfile?.role === 'Management') && (
        <div className="bg-white  p-6 md:p-8 rounded-xl shadow-sm border border-gray-100  animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-gray-900  mb-4">Med Carts Management</h2>
          <p className="text-gray-500 ">Med Carts management interface is under development.</p>
        </div>
      )}

      {activeTab === 'driver-management' && (userProfile?.role === 'Admin' || userProfile?.role === 'Management') && (
        <div className="bg-white  p-6 md:p-8 rounded-xl shadow-sm border border-gray-100  animate-in fade-in slide-in-from-top-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Driver Management</h2>
              <p className="text-sm text-gray-500 mt-1">Manage delivery drivers in the system</p>
            </div>
            <button 
              onClick={() => setIsAddingDriver(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm hover:shadow"
              disabled={isAddingDriver}
            >
              <PlusIcon className="w-5 h-5" />
              Add Driver
            </button>
          </div>
          
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search drivers by name, email, or phone..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 hover:bg-white focus:bg-white text-sm text-gray-800"
            />
          </div>

          <div className="space-y-3">
            {filteredDrivers.length > 0 ? (
              <>
                {filteredDrivers.map(driver => (
                  <div key={driver.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (editingDriverId !== driver.id) {
                          setExpandedDriverId(expandedDriverId === driver.id ? null : driver.id);
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {editingDriverId === driver.id ? (
                        <div className="flex flex-col gap-2 w-full max-w-md pr-8" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingDriverData.first_name}
                            onChange={(e) => setEditingDriverData({ ...editingDriverData, first_name: e.target.value })}
                            className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="First Name"
                            autoFocus
                          />
                          <input 
                            type="text" 
                            value={editingDriverData.last_name}
                            onChange={(e) => setEditingDriverData({ ...editingDriverData, last_name: e.target.value })}
                            className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Last Name"
                          />
                          <input 
                            type="email" 
                            value={editingDriverData.email}
                            onChange={(e) => setEditingDriverData({ ...editingDriverData, email: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Email"
                          />
                          <input 
                            type="text" 
                            value={editingDriverData.phone}
                            onChange={(e) => setEditingDriverData({ ...editingDriverData, phone: e.target.value })}
                            className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Phone"
                          />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingDriverId(null);
                            }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-gray-800 block">{driver.first_name} {driver.last_name}</span>
                          <span className="text-sm text-gray-500 block">{driver.email || 'No email provided'}</span>
                          <span className="text-xs text-blue-600 block mt-0.5">{driver.phone || 'No phone provided'}</span>
                        </div>
                      )}
                      <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedDriverId === driver.id ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {expandedDriverId === driver.id && (
                      <div className="p-4 bg-white border-t border-gray-200 flex gap-3 animate-in slide-in-from-top-2">
                        {editingDriverId === driver.id ? (
                          <button 
                            onClick={() => handleUpdateDriver(driver.id)}
                            className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <CheckCircleIcon className="w-4 h-4" /> Save
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingDriverId(driver.id);
                              setEditingDriverData({ first_name: driver.first_name || '', last_name: driver.last_name || '', email: driver.email || '', phone: driver.phone || '', role: driver.role || 'Driver', job_title: driver.job_title || 'Delivery Driver' });
                            }}
                            className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isAddingDriver && (
                  <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="w-full flex items-start justify-between p-4 bg-white border-b border-blue-100 relative">
                      <div className="flex flex-col gap-2 w-full max-w-md pr-8">
                        <input 
                          type="text" 
                          value={newDriverData.first_name}
                          onChange={(e) => setNewDriverData({ ...newDriverData, first_name: e.target.value })}
                          placeholder="First Name..."
                          className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input 
                          type="text" 
                          value={newDriverData.last_name}
                          onChange={(e) => setNewDriverData({ ...newDriverData, last_name: e.target.value })}
                          placeholder="Last Name..."
                          className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                          type="email" 
                          value={newDriverData.email}
                          onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                          placeholder="Email address..."
                          className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input 
                          type="text" 
                          value={newDriverData.phone}
                          onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                          placeholder="Phone number..."
                          className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                          type="button"
                          onClick={() => { setIsAddingDriver(false); setNewDriverData({ first_name: "", last_name: "", email: "", phone: "", role: "Driver", job_title: "Delivery Driver" }); }}
                          className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white flex gap-3">
                      <button 
                        onClick={handleAddDriver}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> Save Driver
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-500 font-medium">No drivers found.</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'route-management' && (userProfile?.role === 'Admin' || userProfile?.role === 'Management') && (
        <div className="bg-white  p-6 md:p-8 rounded-xl shadow-sm border border-gray-100  animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-gray-900  mb-4">Route/Location Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Available Routes</h3>
              <button 
                onClick={() => { setIsAddingRoute(true); setExpandedRouteId(null); setEditingRouteId(null); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <PlusIcon className="w-4 h-4 stroke-2" />
                Add Route
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search routes..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {filteredRoutes.length > 0 ? (
              <div className="space-y-3">
                {filteredRoutes.map((route) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedRouteId(expandedRouteId === route.id ? null : route.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedRouteId(expandedRouteId === route.id ? null : route.id);
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    >
                      {editingRouteId === route.id ? (
                        <div className="relative w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingRouteName}
                            onChange={(e) => setEditingRouteName(e.target.value)}
                            className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 pr-8 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingRouteId(null); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Cancel edit"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800">{route.name}</span>
                      )}
                      <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedRouteId === route.id ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {expandedRouteId === route.id && (
                      <div className="p-4 bg-white border-t border-gray-200 flex gap-3 animate-in slide-in-from-top-2">
                        <button className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <UserPlusIcon className="w-4 h-4" /> Assign
                        </button>
                        {editingRouteId === route.id ? (
                          <button 
                            onClick={() => handleUpdateRoute(route.id)}
                            className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <CheckCircleIcon className="w-4 h-4" /> Save
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingRouteId(route.id);
                              setEditingRouteName(route.name);
                            }}
                            className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteRoute(route.id)}
                          className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {isAddingRoute && (
                  <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="w-full flex items-center justify-between p-4 bg-white border-b border-blue-100">
                      <div className="relative w-full max-w-xs">
                        <input 
                          type="text" 
                          value={newRouteName}
                          onChange={(e) => setNewRouteName(e.target.value)}
                          placeholder="Enter new route name..."
                          className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 pr-8 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => { setIsAddingRoute(false); setNewRouteName(""); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Cancel add"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white flex gap-3">
                      <button 
                        onClick={handleAddRoute}
                        className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> Save New Route
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No routes currently available.</p>
            )}
          </div>

          {/* --- AVAILABLE FACILITIES SECTION --- */}
          <div className="mt-10 space-y-4 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Available Facilities</h3>
              <button 
                onClick={() => { setIsAddingFacility(true); setExpandedFacilityId(null); setEditingFacilityId(null); }}
                className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
              >
                <PlusIcon className="w-4 h-4 stroke-2" />
                Add Facility
              </button>
            </div>
            <div className="relative mt-4">
              <input
                type="text"
                placeholder="Search facilities (name, city, state)..."
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="space-y-3">
              {filteredFacilities.length > 0 ? (
                <>
                  {filteredFacilities.slice(0, visibleFacilityCount).map(facility => (
                  <div key={facility.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedFacilityId(expandedFacilityId === facility.id ? null : facility.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedFacilityId(expandedFacilityId === facility.id ? null : facility.id);
                        }
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 relative"
                    >
                      {editingFacilityId === facility.id ? (
                        <div className="flex flex-col gap-2 w-full max-w-md pr-8" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editingFacilityData.name}
                            onChange={(e) => setEditingFacilityData({ ...editingFacilityData, name: e.target.value })}
                            placeholder="Facility Name"
                            className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                          <input 
                            type="text" 
                            value={editingFacilityData.address}
                            onChange={(e) => setEditingFacilityData({ ...editingFacilityData, address: e.target.value })}
                            placeholder="Address"
                            className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <input 
                            type="text" 
                            value={editingFacilityData.phone}
                            onChange={(e) => setEditingFacilityData({ ...editingFacilityData, phone: e.target.value })}
                            placeholder="Phone Number"
                            className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingFacilityId(null); }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Cancel edit"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-gray-800 block">{facility.name}</span>
                          <span className="text-sm text-gray-500 block">{facility.address || 'No address provided'}</span>
                          <span className="text-xs text-blue-600 block mt-0.5">{facility.phone || 'No phone provided'}</span>
                        </div>
                      )}
                      <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedFacilityId === facility.id ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {expandedFacilityId === facility.id && (
                      <div className="p-4 bg-white border-t border-gray-200 flex gap-3 animate-in slide-in-from-top-2">
                        <button className="flex-1 py-2 px-3 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <UserPlusIcon className="w-4 h-4" /> Assign
                        </button>
                        {editingFacilityId === facility.id ? (
                          <button 
                            onClick={() => handleUpdateFacility(facility.id)}
                            className="flex-1 py-2 px-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <CheckCircleIcon className="w-4 h-4" /> Save
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingFacilityId(facility.id);
                              setEditingFacilityData({ name: facility.name, address: facility.address || '', phone: facility.phone || '' });
                            }}
                            className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteFacility(facility.id)}
                          className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <TrashIcon className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isAddingFacility && (
                  <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="w-full flex items-start justify-between p-4 bg-white border-b border-purple-100 relative">
                      <div className="flex flex-col gap-2 w-full max-w-md pr-8">
                        <input 
                          type="text" 
                          value={newFacilityData.name}
                          onChange={(e) => setNewFacilityData({ ...newFacilityData, name: e.target.value })}
                          placeholder="Enter facility name..."
                          className="font-semibold text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <input 
                          type="text" 
                          value={newFacilityData.address}
                          onChange={(e) => setNewFacilityData({ ...newFacilityData, address: e.target.value })}
                          placeholder="Enter address..."
                          className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input 
                          type="text" 
                          value={newFacilityData.phone}
                          onChange={(e) => setNewFacilityData({ ...newFacilityData, phone: e.target.value })}
                          placeholder="Enter phone number..."
                          className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button 
                          type="button"
                          onClick={() => { setIsAddingFacility(false); setNewFacilityData({ name: "", address: "", phone: "" }); }}
                          className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Cancel add"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white flex gap-3">
                      <button 
                        onClick={handleAddFacility}
                        className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> Save Facility
                      </button>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-gray-500 font-medium">No facilities found.</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>

            {(filteredFacilities.length > visibleFacilityCount || visibleFacilityCount > 5) && (
              <div className="text-center mt-6 flex justify-center gap-4">
                {visibleFacilityCount > 5 && (
                  <button onClick={() => setVisibleFacilityCount(prev => Math.max(5, prev - 5))} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full transition">
                    Show Less
                  </button>
                )}
                {filteredFacilities.length > visibleFacilityCount && (
                  <button onClick={() => setVisibleFacilityCount(prev => prev + 5)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition">
                    Load More
                  </button>
                )}
              </div>
            )}
          </div>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`whitespace-nowrap px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.trip_type === 'Pre-Trip' ? 'bg-blue-100 text-blue-800  ' : 'bg-orange-100 text-orange-800  '
                          }`}>
                            {log.trip_type}
                          </span>
                          {log.edit_count > 0 && (
                            <div className="relative">
                              <span 
                                onClick={() => setActiveTooltipLogId(activeTooltipLogId === log.id ? null : log.id)}
                                className="whitespace-nowrap px-2 inline-flex items-center gap-1 text-[10px] leading-5 font-bold rounded-full bg-purple-100 text-purple-700 uppercase tracking-wider border border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors" 
                              >
                                Edited <InformationCircleIcon className="w-3 h-3" />
                              </span>
                              {activeTooltipLogId === log.id && (
                                <div className="absolute z-50 mt-2 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-xs text-gray-700 font-normal">
                                  <div className="flex justify-between items-center border-b pb-1 mb-2">
                                    <span className="font-bold text-gray-900">Edit Details</span>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveTooltipLogId(null); }} className="text-gray-400 hover:text-gray-600">
                                      <XCircleIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <p className="mb-1"><span className="font-semibold">Times edited:</span> {log.edit_count}</p>
                                  {log.edit_history && log.edit_history.length > 0 && (
                                    <>
                                      <p className="mb-1"><span className="font-semibold">By:</span> {log.edit_history[log.edit_history.length - 1].editor_name || 'System'}</p>
                                      <p><span className="font-semibold">At:</span> {new Date(log.edit_history[log.edit_history.length - 1].edited_at).toLocaleString()}</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
            
            {(visibleLogs.length > visibleCount || visibleCount > 5) && (
              <div className="text-center mt-6 flex justify-center gap-4">
                {visibleCount > 5 && (
                  <button onClick={() => setVisibleCount(prev => Math.max(5, prev - 5))} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full transition">
                    Show Less
                  </button>
                )}
                {visibleLogs.length > visibleCount && (
                  <button onClick={() => setVisibleCount(prev => prev + 5)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition">
                    Load More
                  </button>
                )}
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
            
                        {tripType === 'Post-Trip' && (
                          <>
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
          </>
        )}



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
