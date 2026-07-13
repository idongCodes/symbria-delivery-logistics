import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ROUTE_DATA: any[] = [];

async function main() {
  const allStops = ROUTE_DATA.flatMap(r => r.stops);
  let createdCount = 0;
  
  for (const stop of allStops) {
    try {
      await prisma.facility.upsert({
        where: { name: stop.name },
        update: {
          address: stop.address,
          phone: stop.phone,
        },
        create: {
          name: stop.name,
          address: stop.address,
          phone: stop.phone,
        },
      });
      createdCount++;
    } catch (e) {
      console.error('Error with stop:', stop.name, e);
    }
  }
  
  console.log("Finished upserting " + createdCount + " facilities.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
