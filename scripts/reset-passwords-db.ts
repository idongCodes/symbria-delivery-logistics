import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAILS = [
  'lholden@symbria.com',
  'ressien1@symbria.com',
  'idongesit_essien@ymail.com'
];

const NEW_PASSWORD = 'Symbr!@3S0P&#gh7Trw';

async function main() {
  console.log("Starting database password update...");
  
  // Update encrypted_password in auth.users using pgcrypto extension's crypt function
  const updatedCount = await prisma.$executeRaw`
    UPDATE auth.users
    SET 
      encrypted_password = crypt(${NEW_PASSWORD}, gen_salt('bf', 10)),
      updated_at = NOW()
    WHERE LOWER(email) IN (${TARGET_EMAILS[0]}, ${TARGET_EMAILS[1]}, ${TARGET_EMAILS[2]});
  `;

  console.log(`Successfully updated ${updatedCount} user(s) in auth.users table.`);
}

main()
  .catch((e) => {
    console.error("Failed to update passwords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
