import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Syncing passwords for lholden@symbria.com and ressien1@symbria.com to match idongesit_essien@ymail.com...");

  // 1. Fetch the encrypted password hash for idongesit_essien@ymail.com
  const sourceUser = await prisma.$queryRaw<Array<{ encrypted_password: string }>>`
    SELECT encrypted_password 
    FROM auth.users 
    WHERE email = 'idongesit_essien@ymail.com';
  `;

  if (!sourceUser || sourceUser.length === 0 || !sourceUser[0].encrypted_password) {
    throw new Error("Could not find source user idongesit_essien@ymail.com or their password is not set.");
  }

  const hash = sourceUser[0].encrypted_password;
  console.log("Source password hash retrieved successfully.");

  // 2. Set the encrypted_password for the target users to this hash
  const updatedCount = await prisma.$executeRaw`
    UPDATE auth.users
    SET 
      encrypted_password = ${hash},
      updated_at = NOW()
    WHERE email IN ('lholden@symbria.com', 'ressien1@symbria.com');
  `;

  console.log(`Successfully synced password for ${updatedCount} user(s).`);
}

main()
  .catch((e) => {
    console.error("Failed to sync passwords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
