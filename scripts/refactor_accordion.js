const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The file has a very specific structure. We will split it using exact string markers.

const tabsMarkerStart = "{userProfile && ( // Only show tabs if user is authenticated";
const myInfoMarker = "{activeTab === 'my-info' && userProfile && (";
const medCartsMarker = "{activeTab === 'med-carts' && userProfile?.role === 'Admin' && (";
const historyMarker = "{userProfile && (activeTab === 'history' || activeTab === 'all') && (";
const formMarker = "{/* Main Form */}";
const eofMarker = "  );\n}";

const tabsStartIdx = content.indexOf(tabsMarkerStart);
const myInfoIdx = content.indexOf(myInfoMarker);
const medCartsIdx = content.indexOf(medCartsMarker);
const historyIdx = content.indexOf(historyMarker);
const formIdx = content.indexOf(formMarker);
const eofIdx = content.lastIndexOf(eofMarker);

// Extract the blocks
const headerBlock = content.substring(0, tabsStartIdx);
const myInfoBlock = content.substring(myInfoIdx, medCartsIdx).trim();
const medCartsBlock = content.substring(medCartsIdx, historyIdx).trim();
const historyAllBlock = content.substring(historyIdx, formIdx).trim();

// To extract the form, we go from formIdx to the last closing tags of the component
// The component ends with:
//         </div>
//       )}
// 
//           </div>
//   );
// }
// So we find the last "</div>" before eofIdx
const lastDivIdx = content.lastIndexOf("</div>", eofIdx - 1);
const formBlock = content.substring(formIdx, lastDivIdx).trim();

// The tail is everything from lastDivIdx to the end
const tailBlock = content.substring(lastDivIdx);

const accordionWrapper = `
      {/* ACCORDION VIEWS FOR AUTHENTICATED USERS */}
      {userProfile ? (
        <div className="flex flex-col gap-3 mb-6 max-w-6xl mx-auto w-full">
          
          {/* 1. NEW FORM */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => { setActiveTab(activeTab === 'new' ? '' : 'new'); setEditingLog(null); setVisibleCount(5); }}
              className="w-full flex justify-between items-center p-4 md:p-5 font-bold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📝</span>
                {editingLog ? \`Editing #\${editingLog.id}\` : 'New Form'}
              </div>
              <span className="text-gray-400">{activeTab === 'new' ? '▼' : '▶'}</span>
            </button>
            {activeTab === 'new' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                ${formBlock.replace("{(!userProfile || activeTab === 'new') && (", "{true && (")}
              </div>
            )}
          </div>

          {/* 2. MY LOGS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => { setActiveTab(activeTab === 'history' ? '' : 'history'); setEditingLog(null); setVisibleCount(5); }}
              className="w-full flex justify-between items-center p-4 md:p-5 font-bold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📋</span> My Logs
              </div>
              <span className="text-gray-400">{activeTab === 'history' ? '▼' : '▶'}</span>
            </button>
            {activeTab === 'history' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                ${historyAllBlock.replace("{userProfile && (activeTab === 'history' || activeTab === 'all') && (", "{true && (")}
              </div>
            )}
          </div>

          {/* 3. ALL LOGS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => { setActiveTab(activeTab === 'all' ? '' : 'all'); setEditingLog(null); setVisibleCount(5); }}
              className="w-full flex justify-between items-center p-4 md:p-5 font-bold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-purple-600">🌍</span> All Logs
              </div>
              <span className="text-gray-400">{activeTab === 'all' ? '▼' : '▶'}</span>
            </button>
            {activeTab === 'all' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                ${historyAllBlock.replace("{userProfile && (activeTab === 'history' || activeTab === 'all') && (", "{true && (")}
              </div>
            )}
          </div>

          {/* 4. MED CARTS */}
          {userProfile?.role === 'Admin' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button 
                onClick={() => { setActiveTab(activeTab === 'med-carts' ? '' : 'med-carts'); setEditingLog(null); setVisibleCount(5); }}
                className="w-full flex justify-between items-center p-4 md:p-5 font-bold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-green-600">💊</span> Med Carts
                </div>
                <span className="text-gray-400">{activeTab === 'med-carts' ? '▼' : '▶'}</span>
              </button>
              {activeTab === 'med-carts' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  ${medCartsBlock.replace("{activeTab === 'med-carts' && userProfile?.role === 'Admin' && (", "{true && (")}
                </div>
              )}
            </div>
          )}

          {/* 5. MY INFO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
              onClick={() => { setActiveTab(activeTab === 'my-info' ? '' : 'my-info'); setEditingLog(null); }}
              className="w-full flex justify-between items-center p-4 md:p-5 font-bold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-600">👤</span> My Info
              </div>
              <span className="text-gray-400">{activeTab === 'my-info' ? '▼' : '▶'}</span>
            </button>
            {activeTab === 'my-info' && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                ${myInfoBlock.replace("{activeTab === 'my-info' && userProfile && (", "{true && (")}
              </div>
            )}
          </div>

        </div>
      ) : (
        // UNAUTHENTICATED DRIVER VIEW (JUST THE FORM)
        <div className="w-full">
          ${formBlock.replace("{(!userProfile || activeTab === 'new') && (", "{true && (")}
        </div>
      )}
`;

const finalContent = headerBlock + accordionWrapper + "\n" + tailBlock;

fs.writeFileSync(filePath, finalContent);
console.log("Refactoring complete");
