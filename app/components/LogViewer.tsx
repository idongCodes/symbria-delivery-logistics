"use client";

import ClientDate from "@/app/components/ClientDate";
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// --- CONFIGURATION ---
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

interface LogData {
  id: number;
  created_at: string;
  trip_type: string;
  route_id: string | null;
  odometer: number | string | null;
  notes: string | null;
  checklist: unknown;
  images: unknown;
  driver_name?: string | null;
}

export default function LogViewer({ log }: { log: LogData }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Disable scrolling when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedImage]);

  const relevantQuestions = log.trip_type === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;
  
  // Robust checklist parsing
  let checklist: Record<string, unknown> = {};
  try {
    if (typeof log.checklist === 'string') {
      checklist = JSON.parse(log.checklist);
    } else if (log.checklist && typeof log.checklist === 'object') {
      checklist = log.checklist as Record<string, unknown>;
    }
  } catch (e) {
    console.error("Error parsing checklist:", e);
  }

  const images = (log.images as Record<string, string>) || {};

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

  const exteriorKeys = ["front", "driverSide", "rear", "passengerSide"];
  const tireKeys = ["driverFrontTire", "passengerFrontTire", "driverRearTire", "passengerRearTire"];
  const interiorKeys = ["frontSeat", "back", "trunk", "fuelGauge"];

  const renderImageSection = (keys: string[], title: string) => {
    const hasImages = keys.some(key => images[key]);
    if (!hasImages) return null;

    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keys.map((key) => images[key] && (
            <div key={key} className="space-y-2">
              <p className="text-xs font-bold text-gray-500  text-center uppercase">{imageTitles[key] || key}</p>
              <div 
                className="aspect-video bg-gray-100  rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
                onClick={() => setSelectedImage(images[key])}
              >
                <img src={images[key]} alt={key} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 relative">
      {/* IMAGE MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50 bg-black/20 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Full Resolution" 
              className="max-w-full max-h-full object-contain rounded shadow-2xl animate-in zoom-in-95 duration-300" 
            />
          </div>
        </div>
      )}

      {/* INFO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50  rounded-lg border border-gray-100 ">
        
        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-500  uppercase tracking-wide">Submitted On</span>
          <div className="text-gray-900  font-medium mt-1">
            <ClientDate timestamp={log.created_at} />
          </div>
        </div>
        
        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-500  uppercase tracking-wide">Driver</span>
          <span className="text-gray-900  font-medium mt-1 inline-block">{log.driver_name || 'Unknown'}</span>
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-500  uppercase tracking-wide">Route</span>
          <span className="text-gray-900  font-medium">{log.route_id || 'N/A'}</span>
        </div>
        <div>
          <span className="block text-xs font-bold text-gray-500  uppercase tracking-wide">Odometer</span>
          <span className="text-gray-900  font-medium">{log.odometer?.toString() || 'N/A'}</span>
        </div>
      </div>

      {/* SCANNER SECTION */}
      {log.trip_type === 'Post-Trip' && (
        <div className="animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">Scanner</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 ">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Item</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600  w-24">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Notes / Defects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 ">
                {SCANNER_QUESTIONS.map((q, i) => {
                  const val = (checklist[q] as string) || "-";
                  const comment = checklist[`${q}_COMMENT`] as string | undefined;
                  const isBad = val === "No";

                  return (
                    <tr key={i} className="hover:bg-gray-50 ">
                      <td className="px-4 py-3 text-gray-800 ">{q}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isBad ? 'bg-red-100 text-red-800  ' : 'bg-green-100 text-green-800  '
                        }`}>
                          {isBad ? 'ISSUE' : 'OK'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {comment ? <span className="text-red-600  font-medium text-xs bg-red-50  px-2 py-1 rounded block w-fit">⚠️ {comment}</span> : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KEY SECTION */}
      {log.trip_type === 'Post-Trip' && (
        <div className="animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">Keys</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 ">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Item</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600  w-24">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Notes / Defects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 ">
                {KEY_QUESTIONS.map((q, i) => {
                  const val = (checklist[q] as string) || "-";
                  const comment = checklist[`${q}_COMMENT`] as string | undefined;
                  const isBad = val === "No";

                  return (
                    <tr key={i} className="hover:bg-gray-50 ">
                      <td className="px-4 py-3 text-gray-800 ">{q}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isBad ? 'bg-red-100 text-red-800  ' : 'bg-green-100 text-green-800  '
                        }`}>
                          {isBad ? 'ISSUE' : 'OK'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {comment ? <span className="text-red-600  font-medium text-xs bg-red-50  px-2 py-1 rounded block w-fit">⚠️ {comment}</span> : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MED RETURNS SECTION */}
      {log.trip_type === 'Post-Trip' && !!checklist["Med Returns"] && (
        <div className="animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">💊 Med Returns</h3>
          {(() => {
            const m = checklist["Med Returns"] as MedReturn;
            if (m.hadReturns === 'Yes') {
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Reason for Return</span>
                      <p className="text-gray-900 font-medium">{m.reason || 'No reason provided'}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Facility / Nurse Station</span>
                      <p className="text-gray-900 font-medium">{m.facilityPatient}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Handed to Pharmacy/Dropbox</span>
                      <p className={`font-bold ${m.handedToPharmacy === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{m.handedToPharmacy}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-orange-600 uppercase mb-1">Refrigeration Required</span>
                      <p className="text-gray-900 font-medium">{m.needsRefrigeration}</p>
                      {m.needsRefrigeration === 'Yes' && (
                        <div className="mt-2 flex items-center gap-2 text-blue-700 bg-blue-100/50 px-3 py-1 rounded-full w-fit">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Status:</span>
                          <span className="text-xs font-bold uppercase">Placed in Fridge: {m.placedInFridge}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <span className="text-gray-700 font-medium">Any Med Returns:</span>
                <span className="ml-2 font-bold text-gray-900">No</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* TACKLE BOX DELIVERIES */}
      {log.trip_type === 'Post-Trip' && !!checklist["Tackle Boxes Included"] && (
        <div className="animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">📦 Tackle Box Deliveries</h3>
          {checklist["Tackle Boxes Included"] === "Yes" && Array.isArray(checklist["Tackle Box Deliveries"]) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(checklist["Tackle Box Deliveries"] as Array<Record<string, unknown>>).map((d, idx) => (
                <div key={idx} className="bg-white  p-4 rounded-lg border border-blue-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b pb-1 mb-2">
                    <h4 className="font-bold text-blue-800 ">{d.location as string}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      Qty: {d.deliveredCount as string || 0}
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 ">Nurse Emptied:</span>
                      <span className={`font-medium ${d.nurseEmptied === 'Yes' ? 'text-green-600 ' : 'text-red-600 '}`}>
                        {d.nurseEmptied as string || 'Unknown'}
                      </span>
                    </div>
                    
                    {d.nurseEmptied === 'Yes' ? (
                      <div className="flex justify-between text-gray-700 ">
                        <span>Returned to Pharmacy:</span>
                        <span className="font-bold">{d.emptiedReturnedCount as string || 0} boxes</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-red-700  font-medium bg-red-50  px-2 py-0.5 rounded">
                          <span>Pharmacy Return:</span>
                          <span>{d.returnedToPharmacy ? 'YES' : 'NO'} ({d.unemptiedReturnedCount as string || 0})</span>
                        </div>
                        <div className="flex justify-between text-gray-700 ">
                          <span>Meds Refrigerated:</span>
                          <span className={d.medsNeedRefrigeration === 'Yes' ? 'font-bold text-blue-600 ' : ''}>
                            {d.medsNeedRefrigeration === 'Yes' ? (d.medsMovedToFridge ? 'Yes (Moved to Fridge)' : 'Yes (NOT MOVED)') : 'No'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-gray-700">
              <strong>Tackle Boxes Included:</strong> {String(checklist["Tackle Boxes Included"])}
            </div>
          )}
        </div>
      )}

      {/* TIRE PRESSURE */}
      <div>
        <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">Tire Pressure (PSI)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Driver Front", "Passenger Front", "Driver Rear", "Passenger Rear"].map((pos) => (
            <div key={pos} className="bg-blue-50  p-3 rounded text-center border border-blue-100 ">
              <span className="block text-xs text-blue-600  font-bold mb-1">{pos}</span>
              <span className="text-lg font-mono text-blue-900 ">{(checklist[`Tire Pressure (${pos})`] as string) || '-'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CHECKLIST */}
      <div>
        <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">Inspection Checklist</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 ">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Item</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600  w-24">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 ">Notes / Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {relevantQuestions.map((q, i) => {
                const val = (checklist[q] as string) || "-";
                const comment = checklist[`${q}_COMMENT`] as string | undefined;
                const isBad = DAMAGE_QUESTIONS.includes(q) ? (val === "Yes") : (val === "No");

                return (
                  <tr key={i} className="hover:bg-gray-50 ">
                    <td className="px-4 py-3 text-gray-800 ">{q}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isBad ? 'bg-red-100 text-red-800  ' : 'bg-green-100 text-green-800  '
                      }`}>
                        {isBad ? 'ISSUE' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comment ? <span className="text-red-600  font-medium text-xs bg-red-50  px-2 py-1 rounded block w-fit">⚠️ {comment}</span> : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VESTIBULE CLEANLINESS */}
      {(checklist["Was there trash in vestibule when you arrived?"] !== undefined) && (
        <div className="animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-800  mb-4 border-b  pb-2">Vestibule Cleanliness</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Was there trash in vestibule when you arrived?</span>
              <span className="text-sm font-medium">{String(checklist["Was there trash in vestibule when you arrived?"])}</span>
            </div>
            {checklist["Was trash removed before you left?"] !== undefined && (
              <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Was trash removed before you left?</span>
                  <span className="text-sm font-medium">{String(checklist["Was trash removed before you left?"])}</span>
                </div>
                {!!checklist["Was trash removed before you left?_COMMENT"] && (
                  <div className="mt-1">
                    <span className="text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded block w-fit">⚠️ {String(checklist["Was trash removed before you left?_COMMENT"])}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADDITIONAL NOTES */}
      {log.notes && (
        <div className="bg-yellow-50  border border-yellow-200  rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-800  uppercase tracking-wide mb-2">Additional Notes</h4>
          <p className="text-yellow-900  text-sm">{log.notes}</p>
        </div>
      )}

      {/* IMAGES */}
      {renderImageSection(exteriorKeys, "Exterior Photos")}
      {renderImageSection(tireKeys, "Tire Photos")}
      {renderImageSection(interiorKeys, "Interior Photos")}
    </div>
  );
}