import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFILES_DATA = [
  { id: "27b38b60-3c77-43e2-8052-fca71495d3a0", first_name: "Richard", last_name: "Essien", email: "ressien1@symbria.com", role: "Admin", job_title: "Delivery Driver", phone: "+17743126471" },
  { id: "39c7ffa7-646d-4f66-b986-fba5166267a6", first_name: "Richard", last_name: "Essien", email: "idongesit_essien@ymail.com", role: "Admin", job_title: null, phone: "+17743126471" },
  { id: "a95812b1-ee0c-49de-a08f-bf837ff31ad4", first_name: "Lester", last_name: "Holden", email: "lholden@symbria.com", role: "Management", job_title: "Logistics Lead", phone: "17745710527" },
];

async function main() {
  for (const profile of PROFILES_DATA) {
    await prisma.profile.upsert({
      where: { id: profile.id },
      update: profile,
      create: profile,
    });
  }
  console.log('Seeded profiles successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
