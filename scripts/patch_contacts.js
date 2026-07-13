const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/contacts/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove PROFILES_DATA and type Profile
content = content.replace(/type Profile = \{[\s\S]*?\};\n\nconst PROFILES_DATA: Profile\[\] = \[[\s\S]*?\];\n\n/, '');

// Add state and fetch for profiles
content = content.replace(
  /const supabase = createClient\(\);\n  const profiles = PROFILES_DATA;\n  const \[dbRoutes, setDbRoutes\] = useState<any\[\]>\(\[\]\);/,
  `const supabase = createClient();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [dbRoutes, setDbRoutes] = useState<any[]>([]);`
);

content = content.replace(
  /const fetchRoutes = async \(\) => {/,
  `const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').order('first_name');
      if (data) setProfiles(data);
    };
    fetchProfiles();

    const fetchRoutes = async () => {`
);

// We need to render the new drivers list style:
// "use our updated prisma profile schema to list the drivers (name, tel: icon, mailto: icon) to our driver section in our contacts page"

// Looking at the driver section rendering in app/contacts/page.tsx
const driverRenderStart = content.indexOf('{/* --- SECTION 3: DRIVERS (from PROFILES_DATA) --- */}');
if (driverRenderStart > -1) {
  content = content.replace(
    /\{drivers\.map\(driver => \([\s\S]*?\}\)/g,
    `{drivers.map(driver => (
            <div key={driver.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold">
                {(driver.first_name?.[0] || '') + (driver.last_name?.[0] || '')}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{driver.first_name} {driver.last_name}</h4>
                <div className="flex gap-3 mt-1">
                  {driver.phone && (
                    <a href={\`tel:\${driver.phone}\`} className="text-gray-400 hover:text-blue-600 transition" title="Call">
                      📞 <span className="sr-only">Call</span>
                    </a>
                  )}
                  {driver.email && (
                    <a href={\`mailto:\${driver.email}\`} className="text-gray-400 hover:text-blue-600 transition" title="Email">
                      ✉️ <span className="sr-only">Email</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
