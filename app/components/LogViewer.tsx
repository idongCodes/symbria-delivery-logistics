"use client";

import ClientDate from "@/app/components/ClientDate";

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
  "Synchronize Scanner, End Route, Log Off",
  "Scanner returned",
  "Tackle boxes returned"
];

const DAMAGE_QUESTIONS = [
  "Dings, dents, or other visible damage on interior/exterior",
  "Cracks/chips on any windows",
  "Dashboard warning lights on"
];

export default function LogViewer({ log }: { log: any }) {
  const relevantQuestions = log.trip_type === 'Post-Trip' ? POST_TRIP_QUESTIONS : PRE_TRIP_QUESTIONS;
  const checklist = (log.checklist as Record<string, string>) || {};
  const images = (log.images as Record<string, string>) || {};

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* INFO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
        
        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Submitted On</span>
          <div className="text-gray-900 dark:text-gray-100 font-medium mt-1">
            <ClientDate timestamp={log.created_at} />
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Route</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{log.route_id || 'N/A'}</span>
        </div>
        <div>
          <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Odometer</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{log.odometer?.toString() || 'N/A'}</span>
        </div>
      </div>

      {/* TIRE PRESSURE (PRE-TRIP ONLY) */}
      {log.trip_type === 'Pre-Trip' && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Tire Pressure (PSI)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Driver Front", "Passenger Front", "Driver Rear", "Passenger Rear"].map((pos) => (
              <div key={pos} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-center border border-blue-100 dark:border-blue-900/30">
                <span className="block text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{pos}</span>
                <span className="text-lg font-mono text-blue-900 dark:text-blue-100">{checklist[`Tire Pressure (${pos})`] || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKLIST */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Inspection Checklist</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Item</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-24">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Notes / Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {relevantQuestions.map((q, i) => {
                const val = checklist[q] || "-";
                const comment = checklist[`${q}_COMMENT`];
                const isBad = DAMAGE_QUESTIONS.includes(q) ? (val === "Yes") : (val === "No");

                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{q}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isBad ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {isBad ? 'ISSUE' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comment ? <span className="text-red-600 dark:text-red-400 font-medium text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded block w-fit">⚠️ {comment}</span> : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NOTES */}
      {log.notes && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide mb-2">Additional Notes</h4>
          <p className="text-yellow-900 dark:text-yellow-100 text-sm">{log.notes}</p>
        </div>
      )}

      {/* IMAGES */}
      {(images.front || images.back || images.trunk) && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Vehicle Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['front', 'back', 'trunk'].map((key) => images[key] && (
              <div key={key} className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center uppercase">{key} Seat/Area</p>
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={images[key]} alt={key} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}