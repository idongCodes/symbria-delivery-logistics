"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// --- REUSED CONFIGURATION ---
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
  "Any new damage to vehicle?",
  "Synchronize Scanner, End Route, Log Off",
  "Scanner returned & plugged in",
  "Tackle boxes returned"
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

const DAMAGE_QUESTIONS = [
  "Dings, dents, or other visible damage on interior/exterior",
  "Cracks/chips on any windows",
  "Dashboard warning lights on",
  "Any new damage to vehicle?"
];

type MedReturn = {
  hadReturns: 'Yes' | 'No' | null;
  reason?: string;
  facilityPatient: string;
  handedToPharmacy: 'Yes' | 'No' | null;
  needsRefrigeration: 'Yes' | 'No' | null;
  placedInFridge: 'Yes' | 'No' | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LogDownloadButton({ log }: { log: any }) {

  const printLog = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Please allow popups to download/print.");

    // 1. DATA PREP
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
    const checklist = log.checklist || {};
    const images = log.images || {};

    // 2. GENERATE HTML
    const checklistRows = relevantQuestions.map((q: string, index: number) => {
      const val = checklist[q] || "-";
      const comment = checklist[`${q}_COMMENT`];
      
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

    // --- Format Scanner for Print ---
    let scannerRows = "";
    SCANNER_QUESTIONS.forEach(q => {
        const val = checklist[q] || "-";
        const comment = checklist[`${q}_COMMENT`];
        const statusBadge = val === "No" ? `<span class="badge badge-error">ISSUE</span>` : `<span class="badge badge-success">OK</span>`;
        scannerRows += `
          <tr>
            <td class="q-col">${q}</td>
            <td class="s-col">${statusBadge}</td>
            <td class="n-col">${comment ? `<span class="comment">⚠️ ${comment}</span>` : '<span class="text-muted">-</span>'}</td>
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
        const val = checklist[q] || "-";
        const comment = checklist[`${q}_COMMENT`];
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
    
    let checklistObj: Record<string, string> = {};
    try {
      if (typeof checklist === 'string') {
        checklistObj = JSON.parse(checklist);
      } else if (checklist && typeof checklist === 'object') {
        checklistObj = checklist as Record<string, string>;
      }
    } catch (e) {
      console.error("Error parsing checklist in LogDownloadButton:", e);
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
            <p><strong>Facility/Nurse Station:</strong> ${medReturns.facilityPatient}</p>
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

    // --- Format Tackle Box for Print ---
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

      if (images) {
      const exteriorKeys = ["front", "driverSide", "rear", "passengerSide"];
      const tireKeys = ["driverFrontTire", "passengerFrontTire", "driverRearTire", "passengerRearTire"];
      const interiorKeys = ["frontSeat", "back", "trunk"];

      const generateImageHtml = (keys: string[], title: string) => {
        let html = '';
        let sectionImagesHtml = '';
        let count = 0;
        for (const key of keys) {
          if (images[key]) {
            sectionImagesHtml += `
              <div class="img-box">
                <p>${imageTitles[key] || key}</p>
                <img src="${images[key]}" />
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

  return (
    <button 
      onClick={printLog}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
      Download PDF
    </button>
  );
}