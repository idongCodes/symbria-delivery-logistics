import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_EMAILS = [
  'ressien1@symbria.com',
  'idongesit_essien@ymail.com',
  'lholden@symbria.com'
];

const ALLOWED_USER_IDS = [
  '27b38b60-3c77-43e2-8052-fca71495d3a0', // Richard Essien Admin/Driver
  '39c7ffa7-646d-4f66-b986-fba5166267a6', // Richard Essien Admin
  'a95812b1-ee0c-49de-a08f-bf837ff31ad4'  // Lester Holden Management
];

async function main() {
  console.log("Starting database scrub of route, location, and driver data...");

  // 1. Truncate routes table
  const deletedRoutesCount = await prisma.$executeRaw`
    TRUNCATE TABLE public.routes RESTART IDENTITY CASCADE;
  `;
  console.log("Truncated public.routes table.");

  // 2. Truncate facilities table
  const deletedFacilitiesCount = await prisma.$executeRaw`
    TRUNCATE TABLE public.facilities RESTART IDENTITY CASCADE;
  `;
  console.log("Truncated public.facilities table.");

  // 3. Delete non-essential profiles (all drivers except Richard Essien)
  const deletedProfilesCount = await prisma.$executeRaw`
    DELETE FROM public.profiles 
    WHERE email IS NOT NULL AND LOWER(email) NOT IN (${ALLOWED_EMAILS[0]}, ${ALLOWED_EMAILS[1]}, ${ALLOWED_EMAILS[2]});
  `;
  console.log(`Deleted ${deletedProfilesCount} driver profiles from public.profiles.`);

  // 4. Delete corresponding auth.users records in Supabase
  const deletedAuthUsersCount = await prisma.$executeRaw`
    DELETE FROM auth.users 
    WHERE email IS NOT NULL AND LOWER(email) NOT IN (${ALLOWED_EMAILS[0]}, ${ALLOWED_EMAILS[1]}, ${ALLOWED_EMAILS[2]});
  `;
  console.log(`Deleted ${deletedAuthUsersCount} users from auth.users.`);

  // 5. Fetch all trip logs to scrub location and non-essential driver details
  const tripLogs = await prisma.tripLog.findMany();
  console.log(`Processing ${tripLogs.length} trip logs for location/driver anonymization...`);

  let updatedLogsCount = 0;

  for (const log of tripLogs) {
    let shouldUpdate = false;
    let newDriverName = log.driver_name;
    let newRouteId = log.route_id;
    let newChecklist = log.checklist ? JSON.parse(JSON.stringify(log.checklist)) : null;

    // A. Scrub route ID (since all routes are truncated)
    if (log.route_id !== null) {
      newRouteId = null;
      shouldUpdate = true;
    }

    // B. Scrub driver name if it does not belong to Richard Essien (or other allowed users)
    if (log.user_id && !ALLOWED_USER_IDS.includes(log.user_id)) {
      if (log.driver_name !== 'Anonymized Driver') {
        newDriverName = 'Anonymized Driver';
        shouldUpdate = true;
      }
    }

    // C. Scrub location/patient details inside the checklist JSON
    if (newChecklist && typeof newChecklist === 'object') {
      // Scrub Med Returns facility/patient info
      if (newChecklist['Med Returns'] && typeof newChecklist['Med Returns'] === 'object') {
        const medReturns = newChecklist['Med Returns'];
        if (medReturns.facilityPatient !== undefined && medReturns.facilityPatient !== 'Anonymized Facility') {
          medReturns.facilityPatient = 'Anonymized Facility';
          shouldUpdate = true;
        }
      }

      // Scrub Tackle Box Deliveries locations
      if (Array.isArray(newChecklist['Tackle Box Deliveries'])) {
        const deliveries = newChecklist['Tackle Box Deliveries'];
        deliveries.forEach((delivery: any) => {
          if (delivery && typeof delivery === 'object') {
            if (delivery.location !== undefined && delivery.location !== 'Anonymized Location') {
              delivery.location = 'Anonymized Location';
              shouldUpdate = true;
            }
          }
        });
      }
    }

    if (shouldUpdate) {
      await prisma.tripLog.update({
        where: { id: log.id },
        data: {
          driver_name: newDriverName,
          route_id: newRouteId,
          checklist: newChecklist
        }
      });
      updatedLogsCount++;
    }
  }

  console.log(`Successfully anonymized and updated ${updatedLogsCount} trip logs.`);
  console.log("Database scrub complete.");
}

main()
  .catch((e) => {
    console.error("Database scrub failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
