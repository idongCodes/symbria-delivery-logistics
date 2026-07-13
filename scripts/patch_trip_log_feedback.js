const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import for FeedbackTab
if (!content.includes('import FeedbackTab')) {
  content = content.replace(
    /import ClientDate from "@\/app\/components\/ClientDate";/,
    `import ClientDate from "@/app/components/ClientDate";\nimport FeedbackTab from "@/app/components/FeedbackTab";`
  );
}

// Update activeTab type
content = content.replace(
  /useState\<'new' \| 'history' \| 'all' \| 'my-info' \| 'med-carts' \| 'driver-management' \| 'route-management'\>\('new'\);/,
  `useState<'new' | 'history' | 'all' | 'my-info' | 'med-carts' | 'driver-management' | 'route-management' | 'feedback'>('new');`
);

// Add Feedback tab to desktop tabs
const desktopFeedbackTab = `
              <button onClick={() => { setActiveTab('route-management'); setEditingLog(null); setVisibleCount(5); }} className={\`px-4 md:px-6 py-3 font-medium text-sm md:text-base \${activeTab === 'route-management' ? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '}\`}>
                Route/Location Management
              </button>
            </>
          )}

          {userProfile?.role === 'Admin' && (
            <button 
              onClick={() => { setActiveTab('feedback'); setEditingLog(null); setVisibleCount(5); }} 
              className={\`px-4 md:px-6 py-3 font-medium text-sm md:text-base \${activeTab === 'feedback' ? 'text-green-600 border-b-2 border-green-600 ' : 'text-gray-500 '}\`}
            >
              Feedback
            </button>
          )}`;

content = content.replace(
  /<button onClick=\{\(\) => \{ setActiveTab\('route-management'\); setEditingLog\(null\); setVisibleCount\(5\); \}\} className=\{\`px-4 md:px-6 py-3 font-medium text-sm md:text-base \$\{activeTab === 'route-management' \? 'text-green-600  border-b-2 border-green-600 ' : 'text-gray-500 '\}\`\}\>\s*Route\/Location Management\s*<\/button>\s*<\/>\s*\)/,
  desktopFeedbackTab
);

// Add Feedback tab to mobile menu
const mobileFeedbackTab = `
                        <button onClick={() => { setActiveTab('route-management'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={\`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors \${activeTab === 'route-management' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}\`}>
                          Route/Location Management
                        </button>
                      </>
                    )}

                    {userProfile?.role === 'Admin' && (
                      <button onClick={() => { setActiveTab('feedback'); setEditingLog(null); setVisibleCount(5); setIsMobileMenuOpen(false); }} className={\`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1 \${activeTab === 'feedback' ? 'text-green-600 bg-green-50/50' : 'text-gray-700'}\`}>
                        Feedback
                      </button>
                    )}`;

content = content.replace(
  /<button onClick=\{\(\) => \{ setActiveTab\('route-management'\); setEditingLog\(null\); setVisibleCount\(5\); setIsMobileMenuOpen\(false\); \}\} className=\{\`px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-colors \$\{activeTab === 'route-management' \? 'text-green-600 bg-green-50\/50' : 'text-gray-700'\}\`\}\>\s*Route\/Location Management\s*<\/button>\s*<\/>\s*\)/,
  mobileFeedbackTab
);

// Render FeedbackTab component
const feedbackTabRender = `
      {activeTab === 'my-info' && (
`;

content = content.replace(
  /\{activeTab === 'my-info' && \(/,
  `      {activeTab === 'feedback' && userProfile?.role === 'Admin' && <FeedbackTab />}\n\n      {activeTab === 'my-info' && (`
);

fs.writeFileSync(filePath, content, 'utf8');
