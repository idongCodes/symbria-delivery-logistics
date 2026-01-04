"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// --- REUSED CONFIGURATION ---
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

const DAMAGE_QUESTIONS = [
  "Dings, dents, or other visible damage on interior/exterior",
  "Cracks/chips on any windows",
  "Dashboard warning lights on"
];

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
    
    let tireHtml = "";
    if (log.trip_type === 'Pre-Trip') {
      const tDF = checklist["Tire Pressure (Driver Front)"] || "-";
      const tPF = checklist["Tire Pressure (Passenger Front)"] || "-";
      const tDR = checklist["Tire Pressure (Driver Rear)"] || "-";
      const tPR = checklist["Tire Pressure (Passenger Rear)"] || "-";
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

    const imgFront = images.front ? `<div class="img-box"><p>Front Seat</p><img src="${images.front}" /></div>` : '';
    const imgBack = images.back ? `<div class="img-box"><p>Back Seat</p><img src="${images.back}" /></div>` : '';
    const imgTrunk = images.trunk ? `<div class="img-box"><p>Trunk</p><img src="${images.trunk}" /></div>` : '';
    
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