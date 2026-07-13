import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DELETED_EMAILS = [
  'ressien1@symbria.com',
  'lholden@symbria.com'
];

async function main() {
  console.log("Starting database scrub of ressien1 and lholden accounts...");

  // 1. Delete profiles from public.profiles
  const deletedProfiles = await prisma.$executeRaw`
    DELETE FROM public.profiles
    WHERE email IS NOT NULL AND LOWER(email) IN (${DELETED_EMAILS[0]}, ${DELETED_EMAILS[1]});
  `;
  console.log(`Deleted ${deletedProfiles} profiles from public.profiles.`);

  // 2. Delete users from auth.users
  const deletedUsers = await prisma.$executeRaw`
    DELETE FROM auth.users
    WHERE email IS NOT NULL AND LOWER(email) IN (${DELETED_EMAILS[0]}, ${DELETED_EMAILS[1]});
  `;
  console.log(`Deleted ${deletedUsers} users from auth.users.`);

  // 3. Update idongesit_essien@ymail.com profile name and title
  const updatedProfile = await prisma.profile.updateMany({
    where: { email: 'idongesit_essien@ymail.com' },
    data: {
      first_name: "Idongesit",
      last_name: "Essien",
      job_title: "Developer & Admin"
    }
  });
  console.log(`Updated ${updatedProfile.count} profile(s) for idongesit_essien@ymail.com.`);

  // 4. Update raw_user_meta_data in auth.users for idongesit_essien@ymail.com
  const updatedAuthUser = await prisma.$executeRaw`
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || '{"first_name": "Idongesit", "last_name": "Essien"}'::jsonb
    WHERE email = 'idongesit_essien@ymail.com';
  `;
  console.log(`Updated auth metadata for idongesit_essien@ymail.com.`);

  // 5. Anonymize historical logs for the deleted admin/driver (ressien1)
  const anonymizedLogs = await prisma.tripLog.updateMany({
    where: {
      user_id: {
        in: [
          '27b38b60-3c77-43e2-8052-fca71495d3a0', // Richard Essien Admin/Driver
          'a95812b1-ee0c-49de-a08f-bf837ff31ad4'  // Lester Holden
        ]
      }
    },
    data: {
      driver_name: "Anonymized Driver"
    }
  });
  console.log(`Anonymized ${anonymizedLogs.count} historical logs for deleted users.`);

  console.log("Database admin scrub complete.");
}

main()
  .catch((e) => {
    console.error("Database scrub failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
