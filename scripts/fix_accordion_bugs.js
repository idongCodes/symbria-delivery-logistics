const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix visibleLogs array logic to handle multiple active tabs properly
const visibleLogsOld = `  const visibleLogs = logs.filter(log => {
    let match = true;

    if (activeTabs.includes('history')) {
      // Only show logs for the current user
      if (log.user_id !== userProfile?.id) return false;
    } else if (activeTabs.includes('all')) {
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
  });`;

const visibleLogsNew = `  const myVisibleLogs = logs.filter(log => log.user_id === userProfile?.id);
  
  const allVisibleLogs = logs.filter(log => {
    let match = true;
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
    return match;
  });`;

content = content.replace(visibleLogsOld, visibleLogsNew);

// 2. Add new count states
content = content.replace(
  "const [visibleCount, setVisibleCount] = useState(5);", 
  "const [visibleCount, setVisibleCount] = useState(5);\n  const [myVisibleCount, setMyVisibleCount] = useState(5);\n  const [allVisibleCount, setAllVisibleCount] = useState(5);"
);

// RECALCULATE INDICES NOW
const myLogsMarkerStart = "{/* 2. MY LOGS */}";
const allLogsMarkerStart = "{/* 3. ALL LOGS */}";
const medCartsMarkerStart = "{/* 4. MED CARTS */}";

const myLogsIdx = content.indexOf(myLogsMarkerStart);
const allLogsIdx = content.indexOf(allLogsMarkerStart);
const medCartsIdx = content.indexOf(medCartsMarkerStart);

let myLogsBlock = content.substring(myLogsIdx, allLogsIdx);
let allLogsBlock = content.substring(allLogsIdx, medCartsIdx);

// In "My Logs" block, the table shouldn't use "all" logic. So we replace activeTabs.includes('all') with false
myLogsBlock = myLogsBlock.replace(/activeTabs\.includes\('all'\)/g, "false");
// And it should use myVisibleLogs instead of visibleLogs
myLogsBlock = myLogsBlock.replace(/visibleLogs/g, "myVisibleLogs");
myLogsBlock = myLogsBlock.replace(/visibleCount/g, "myVisibleCount");
myLogsBlock = myLogsBlock.replace(/setVisibleCount/g, "setMyVisibleCount");

// In "All Logs" block, the table is meant for "all". So we replace activeTabs.includes('all') with true
allLogsBlock = allLogsBlock.replace(/activeTabs\.includes\('all'\)/g, "true");
// And it should use allVisibleLogs instead of visibleLogs
allLogsBlock = allLogsBlock.replace(/visibleLogs/g, "allVisibleLogs");
allLogsBlock = allLogsBlock.replace(/visibleCount/g, "allVisibleCount");
allLogsBlock = allLogsBlock.replace(/setVisibleCount/g, "setAllVisibleCount");

// Replace back into content
content = content.substring(0, myLogsIdx) + myLogsBlock + allLogsBlock + content.substring(medCartsIdx);

fs.writeFileSync(filePath, content);
console.log("Fix complete");
