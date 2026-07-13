const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/trip-log/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicated newFacilityData
content = content.replace(
  /const \[newFacilityData, setNewFacilityData\] = useState<{name: string, address: string, phone: string}>\({ name: "", address: "", phone: "" }\);\n\n  const \[driverOptions/g,
  '  const [driverOptions'
);

// Import actions
if (!content.includes('import { createProfile')) {
  content = content.replace(
    /import { createRoute, updateRoute, deleteRoute } from '@\/app\/actions\/route-actions';/,
    `import { createRoute, updateRoute, deleteRoute } from '@/app/actions/route-actions';\nimport { createProfile, updateProfile, deleteProfile } from '@/app/actions/profile-actions';`
  );
}

// Handlers
const driverHandlers = `
  const handleAddDriver = async () => {
    if (!newDriverData.first_name || !newDriverData.last_name) {
      showModal({ title: 'Validation Error', message: 'First name and Last name are required', type: 'error' });
      return;
    }
    
    setIsAddingDriver(false);
    const result = await createProfile({
      first_name: newDriverData.first_name.trim(),
      last_name: newDriverData.last_name.trim(),
      email: newDriverData.email.trim(),
      phone: newDriverData.phone.trim(),
      role: newDriverData.role.trim(),
      job_title: newDriverData.job_title.trim(),
    });

    if (result.success && result.profile) {
      setDriverOptions(prev => [...prev, result.profile]);
      setNewDriverData({ first_name: "", last_name: "", email: "", phone: "", role: "Driver", job_title: "Delivery Driver" });
      showModal({ title: 'Driver Added', message: 'Successfully added new driver.', type: 'success' });
    } else {
      showModal({ title: 'Error', message: result.error || 'Failed to add driver', type: 'error' });
    }
  };

  const handleUpdateDriver = (driverId: string) => {
    showModal({
      title: 'Update Driver',
      message: 'Are you sure you want to update this driver\\'s information?',
      type: 'confirm',
      confirmText: 'Update Driver',
      onConfirm: async () => {
        const previousDrivers = [...driverOptions];
        const newData = {
          first_name: editingDriverData.first_name.trim(),
          last_name: editingDriverData.last_name.trim(),
          email: editingDriverData.email.trim(),
          phone: editingDriverData.phone.trim(),
          role: editingDriverData.role.trim(),
          job_title: editingDriverData.job_title.trim(),
        };
        setDriverOptions(driverOptions.map(d => d.id === driverId ? { ...d, ...newData } : d));
        setEditingDriverId(null);
        
        const result = await updateProfile(driverId, newData);
        if (!result.success) {
          showModal({ title: 'Error', message: result.error || 'Failed to update driver', type: 'error' });
          setDriverOptions(previousDrivers);
        } else {
          showModal({ title: 'Driver Updated', message: 'Successfully updated driver details.', type: 'success' });
        }
      }
    });
  };

  const handleDeleteDriver = (driverId: string) => {
    showModal({
      title: 'Delete Driver',
      message: 'Are you sure you want to completely delete this driver? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete Driver',
      onConfirm: async () => {
        const previousDrivers = [...driverOptions];
        setDriverOptions(driverOptions.filter(d => d.id !== driverId));
        
        const result = await deleteProfile(driverId);
        if (!result.success) {
          showModal({ title: 'Error', message: result.error || 'Failed to delete driver', type: 'error' });
          setDriverOptions(previousDrivers);
        }
      }
    });
  };

  const filteredDrivers = driverOptions.filter(driver => 
    (driver.first_name + ' ' + driver.last_name).toLowerCase().includes(driverSearch.toLowerCase()) ||
    (driver.email || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    (driver.phone || '').toLowerCase().includes(driverSearch.toLowerCase())
  );
`;

if (!content.includes('handleAddDriver')) {
  content = content.replace(
    /const filteredFacilities = facilityOptions.filter/,
    `${driverHandlers}\n\n  const filteredFacilities = facilityOptions.filter`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
