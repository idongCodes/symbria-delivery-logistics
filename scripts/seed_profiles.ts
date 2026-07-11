import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFILES_DATA = [
  { id: "27b38b60-3c77-43e2-8052-fca71495d3a0", first_name: "Richard", last_name: "Essien", email: "ressien1@symbria.com", role: "Admin", job_title: "Delivery Driver", phone: "+17743126471" },
  { id: "39c7ffa7-646d-4f66-b986-fba5166267a6", first_name: "Richard", last_name: "Essien", email: "idongesit_essien@ymail.com", role: "Admin", job_title: null, phone: "+17743126471" },
  { id: "74a3b563-6edd-42e9-9bbb-17568209f303", first_name: "Henry", last_name: "Edu", email: "hedusei@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "7742535472" },
  { id: "a95812b1-ee0c-49de-a08f-bf837ff31ad4", first_name: "Lester", last_name: "Holden", email: "lholden@symbria.com", role: "Management", job_title: "Logistics Lead", phone: "17745710527" },
  { id: "bfdcfa68-c121-47e2-a3a6-beb3646d0bbf", first_name: "Angelina", last_name: "Bermudez", email: "abermudez@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "5406640494" },
  { id: "1e740275-02a1-4edd-8ec4-f6797449a036", first_name: "Nicolas", last_name: "Guastini", email: "nguastini@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "8603825753" },
  { id: "59bac5f3-2a6b-4d83-b2b4-7b6a255dd35f", first_name: "Andrew", last_name: "Schofield ", email: "aschofield@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "7746330462" },
  { id: "2af0e4a8-331a-4d4b-ad89-393bb2b79cf1", first_name: "Ryan", last_name: "Mapes", email: "rmapes@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "774-272-5107" },
  { id: "7e4778f5-d6e8-4369-b296-688e2f9ca935", first_name: "Michael ", last_name: "Boylan ", email: "mboylan@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "5088689341" },
  { id: "1c6c2ab5-29b1-4965-9e18-3000f70de397", first_name: "Julian", last_name: "Sarkodieh", email: "jsarkodieh@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "15084101032" },
  { id: "38093bc5-def4-448b-806b-0ea86e9e56d1", first_name: "Mario", last_name: "Hargrove", email: "mhargrove@symbria.com", role: "Driver", job_title: "Delivery Driver", phone: "15083408591" },
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
