export default function ContactsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Important Numbers & Info</h2>
      
      {/* --- SECTION 1: DEVELOPER & ADMIN --- */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-1 rounded text-sm">🛠️</span> Developer & Admin
        </h3>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl shadow-sm">
              👨‍💻
            </div>
          </div>
          <div className="flex-grow">
            <h4 className="text-xl font-bold text-gray-900">Richard Essien</h4>
            <p className="text-blue-600 font-medium mb-3">Developer / Admin / Driver</p>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
              <a href="mailto:ressien1@symbria.com" className="flex items-center gap-2 hover:text-blue-600 transition">
                <span className="bg-gray-100 p-1.5 rounded">✉️</span> ressien1@symbria.com
              </a>
              <a href="tel:+17743126471" className="flex items-center gap-2 hover:text-blue-600 transition">
                <span className="bg-gray-100 p-1.5 rounded">📞</span> +1 (774) 312-6471
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- SECTION 2: MANAGEMENT --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 p-1 rounded text-sm">👔</span> Management
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">JS</div>
                <div>
                  <p className="font-bold text-gray-900">John Smith</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Operations Manager</p>
                  <a href="tel:5551234567" className="text-sm text-blue-600 hover:underline block mt-1">(555) 123-4567</a>
                </div>
              </li>
              {/* Add more managers here */}
              <li className="pt-4 border-t border-gray-100 text-center text-gray-400 italic text-sm">
                More contacts coming soon...
              </li>
            </ul>
          </div>
        </div>

        {/* --- SECTION 3: DRIVERS --- */}
        <div>
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 p-1 rounded text-sm">🚚</span> Drivers
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <p className="text-sm text-gray-500 mb-4">Primary contact list for active drivers.</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Driver Dispatch</span>
                <a href="tel:5559998888" className="text-sm bg-white border px-2 py-1 rounded text-blue-600 font-semibold hover:bg-blue-50">Call Dispatch</a>
              </div>
              <div className="text-center py-4 text-gray-400 text-sm italic">
                Driver roster updating...
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- SECTION 4: ROUTES --- */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-600 p-1 rounded text-sm">📍</span> Standard Routes
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Route ID</th>
                <th className="p-4 font-semibold text-gray-700">Region</th>
                <th className="p-4 font-semibold text-gray-700">Primary Stops</th>
                <th className="p-4 font-semibold text-gray-700">Est. Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">R-101</td>
                <td className="p-4 text-gray-800">North Shore</td>
                <td className="p-4 text-gray-600">Salem, Beverly, Peabody</td>
                <td className="p-4 text-gray-500">4 Hrs</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">R-102</td>
                <td className="p-4 text-gray-800">Metro West</td>
                <td className="p-4 text-gray-600">Framingham, Natick, Wellesley</td>
                <td className="p-4 text-gray-500">5.5 Hrs</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">R-103</td>
                <td className="p-4 text-gray-800">South Shore</td>
                <td className="p-4 text-gray-600">Quincy, Braintree, Weymouth</td>
                <td className="p-4 text-gray-500">4.5 Hrs</td>
              </tr>
            </tbody>
          </table>
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
            * Routes subject to change based on traffic and volume.
          </div>
        </div>
      </div>

    </div>
  );
}
