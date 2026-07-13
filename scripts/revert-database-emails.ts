import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Reverting database user email domains from @rxdeliverylogistics.com to @symbria.com...");

  // 1. Update public.profiles table
  const updatedProfiles = await prisma.$executeRaw`
    UPDATE public.profiles
    SET email = REPLACE(email, '@rxdeliverylogistics.com', '@symbria.com')
    WHERE email LIKE '%@rxdeliverylogistics.com';
  `;
  console.log(`Reverted ${updatedProfiles} profiles in public.profiles table.`);

  // 2. Update auth.users table in Supabase Auth schema
  const updatedUsers = await prisma.$executeRaw`
    UPDATE auth.users
    SET 
      email = REPLACE(email, '@rxdeliverylogistics.com', '@symbria.com'),
      raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', REPLACE(email, '@rxdeliverylogistics.com', '@symbria.com'))
    WHERE email LIKE '%@rxdeliverylogistics.com';
  `;
  console.log(`Reverted ${updatedUsers} users in auth.users table.`);
}

main()
  .catch((e) => {
    console.error("Database email reversion failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
