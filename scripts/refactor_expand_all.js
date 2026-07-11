const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change state declaration
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'new' | 'history' | 'all' | 'my-info' | 'med-carts'>('new');",
  "const [activeTabs, setActiveTabs] = useState<string[]>(['new']);\n  const toggleTab = (tab: string) => setActiveTabs(prev => prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]);\n  const toggleAll = () => setActiveTabs(prev => prev.length >= 4 ? [] : ['new', 'history', 'all', 'med-carts', 'my-info']);"
);

// 2. Change setActiveTab toggles in the accordion
content = content.replace(/setActiveTab\(activeTab === '([^']+)' \? '' : '\1'\)/g, "toggleTab('$1')");

// 3. Change chevron logic and condition logic
content = content.replace(/activeTab === 'history'/g, "activeTabs.includes('history')");
content = content.replace(/activeTab === 'all'/g, "activeTabs.includes('all')");
content = content.replace(/activeTab === 'new'/g, "activeTabs.includes('new')");
content = content.replace(/activeTab === 'med-carts'/g, "activeTabs.includes('med-carts')");
content = content.replace(/activeTab === 'my-info'/g, "activeTabs.includes('my-info')");

// 4. Add "Expand/Collapse All" button
// We'll place it right above the accordion views block
const accordionMarker = "{/* ACCORDION VIEWS FOR AUTHENTICATED USERS */}";
const expandAllButton = `
      {userProfile?.role === 'Admin' && (
        <div className="max-w-6xl mx-auto w-full flex justify-end mb-4">
          <button 
            onClick={toggleAll}
            className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200"
          >
            {activeTabs.length >= 4 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      )}
`;
content = content.replace(accordionMarker, expandAllButton + '\n      ' + accordionMarker);

fs.writeFileSync(filePath, content);
console.log("Refactoring complete");
