const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const driverUi = `
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
                      <ChevronDownIcon className={\`w-5 h-5 text-gray-500 transition-transform \${expandedDriverId === driver.id ? 'rotate-180' : ''}\`} />
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
`;

content = content.replace(
  /<h2 className="text-xl font-bold text-gray-900  mb-4">Driver Management<\/h2>\n\s*<p className="text-gray-500 ">Driver management interface is under development.<\/p>/,
  driverUi.trim()
);

fs.writeFileSync(filePath, content, 'utf8');
