import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Updating database user email domains from @symbria.com to @rxdeliverylogistics.com...");

  // 1. Update public.profiles table (Prisma model Profile)
  const updatedProfiles = await prisma.$executeRaw`
    UPDATE public.profiles
    SET email = REPLACE(email, '@symbria.com', '@rxdeliverylogistics.com')
    WHERE email LIKE '%@symbria.com';
  `;
  console.log(`Updated ${updatedProfiles} profiles in public.profiles table.`);

  // 2. Update auth.users table in Supabase Auth schema
  const updatedUsers = await prisma.$executeRaw`
    UPDATE auth.users
    SET 
      email = REPLACE(email, '@symbria.com', '@rxdeliverylogistics.com'),
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', REPLACE(email, '@symbria.com', '@rxdeliverylogistics.com'))
    WHERE email LIKE '%@symbria.com';
  `;
  console.log(`Updated ${updatedUsers} users in auth.users table.`);
}

main()
  .catch((e) => {
    console.error("Database email update failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
